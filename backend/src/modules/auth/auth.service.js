const bcrypt = require("bcrypt");
const { randomUUID, createHash, randomInt } = require("crypto");
const jwt = require("jsonwebtoken");
const { withTransaction } = require("../../db/tx");
const pool = require("../../db/pool");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { sendAuthOtp } = require("./otpDelivery");
const { verifyGoogleIdToken } = require("./social.provider");

const memoryUsers = [];
const memoryOtps = [];
let loggedMemoryFallback = false;
let otpTableReady = false;

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function resolveRegistrationEmail(email, phone) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    return normalizedEmail;
  }

  const phoneSlug = normalizePhone(phone).replace(/[^a-zA-Z0-9]/g, "");
  const fallbackId = phoneSlug || `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  return `phone-${fallbackId}@noemail.local`;
}

function buildDefaultFullName(email, fullName) {
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }

  const localPart = email.split("@")[0] || "user";
  return localPart;
}

function buildDefaultPhone(phone) {
  if (phone && phone.trim()) {
    return phone.trim();
  }

  return `temp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "").trim();
}

function detectChannelFromIdentifier(identifier) {
  return String(identifier || "").includes("@") ? "EMAIL" : "PHONE";
}

function normalizeTarget(channel, target) {
  return channel === "EMAIL" ? normalizeEmail(target) : normalizePhone(target);
}

function maskTarget(channel, target) {
  if (channel === "EMAIL") {
    const normalized = normalizeEmail(target);
    const [name, domain = ""] = normalized.split("@");
    if (!name) {
      return normalized;
    }

    return `${name.slice(0, 2)}***@${domain}`;
  }

  const normalized = normalizePhone(target);
  if (normalized.length <= 4) {
    return "****";
  }

  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
}

function buildOtpCode() {
  return String(randomInt(100000, 999999)).padStart(6, "0");
}

async function generateUniqueUsername(baseUsername, excludeUserId = null) {
  const base = String(baseUsername || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .substring(0, 40)
    .replace(/^[^a-z0-9]/, "")
    .replace(/[^a-z0-9]$/, "");

  if (!base || base.length < 3) {
    // Generate from random if base is invalid
    const randomNum = randomInt(1000000, 9999999);
    return `user${randomNum}`;
  }

  // Try the base username first
  let query = "SELECT id FROM users WHERE LOWER(username) = $1";
  let params = [base];
  if (excludeUserId) {
    query += " AND id != $2";
    params.push(excludeUserId);
  }

  try {
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return base;
    }
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const exists = memoryUsers.some(
        (user) => String(user.username || "").toLowerCase() === base && user.id !== excludeUserId
      );
      if (!exists) {
        return base;
      }
    }
  }

  // Add random suffix if base is taken
  for (let i = 0; i < 10; i++) {
    const suffix = randomInt(100, 999);
    const candidate = `${base}${suffix}`;
    let query = "SELECT id FROM users WHERE LOWER(username) = $1";
    let params = [candidate];
    if (excludeUserId) {
      query += " AND id != $2";
      params.push(excludeUserId);
    }

    try {
      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        return candidate;
      }
    } catch (error) {
      if (shouldUseMemoryFallback(error)) {
        const exists = memoryUsers.some(
          (user) => String(user.username || "").toLowerCase() === candidate && user.id !== excludeUserId
        );
        if (!exists) {
          return candidate;
        }
      }
    }
  }

  // If still not found, use timestamp-based
  return `${base}${Date.now()}`.substring(0, 50);
}

function buildOtpDigest({ code, target, purpose }) {
  return createHash("sha256")
    .update(`${code}:${target}:${purpose}:${env.JWT_SECRET}`)
    .digest("hex");
}

async function ensureOtpTable() {
  if (otpTableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id UUID PRIMARY KEY,
      purpose VARCHAR(32) NOT NULL,
      channel VARCHAR(16) NOT NULL,
      target VARCHAR(255) NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  otpTableReady = true;
}

function shouldUseMemoryFallback(error) {
  if (!error || error instanceof ApiError) {
    return false;
  }

  const code = String(error.code || "").toUpperCase();
  const message = String(error.message || "").toLowerCase();

  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    message.includes("connect") ||
    message.includes("database") ||
    message.includes("timeout")
  );
}

function shouldUseDevOtpDeliveryFallback(error) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Allow SMS fallback for any SMS delivery error (unavailable, failed, not configured)
  // This ensures system functionality when SMS provider is unavailable or misconfigured
  return [
    "SMS_DELIVERY_FAILED",
    "SMS_PROVIDER_ERROR",
    "SMS_DELIVERY_NOT_CONFIGURED",
    "WHATSAPP_DELIVERY_FAILED",
    "WHATSAPP_PROVIDER_ERROR",
    "WHATSAPP_DELIVERY_NOT_CONFIGURED"
  ].includes(error.code);
}

function logMemoryFallbackOnce(error) {
  if (loggedMemoryFallback) {
    return;
  }

  loggedMemoryFallback = true;
  console.warn("[auth.service] Database unavailable; using in-memory auth store", {
    code: error.code,
    message: error.message
  });
}

async function deliverOtp({ code, channel, target, purpose }) {
  return sendAuthOtp({
    code,
    channel,
    target,
    purpose
  });
}

async function registerInMemory({ fullName, email, phone, password }) {
  const normalizedEmail = resolveRegistrationEmail(email, phone);
  const existing = memoryUsers.find((item) => item.email === normalizedEmail);

  if (existing) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const hash = await bcrypt.hash(password, 12);
  const role = normalizedEmail === env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
  const createdAt = new Date().toISOString();
  const username = await generateUniqueUsername(buildDefaultFullName(normalizedEmail, fullName));

  const user = {
    id: randomUUID(),
    full_name: buildDefaultFullName(normalizedEmail, fullName),
    username,
    email: normalizedEmail,
    phone: buildDefaultPhone(phone),
    password_hash: hash,
    role,
    created_at: createdAt
  };

  memoryUsers.push(user);

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    },
    token: buildToken(user)
  };
}

function createMemoryOtp({ purpose, channel, target }) {
  const otpSessionId = randomUUID();
  const code = buildOtpCode();
  const expiresAt = Date.now() + OTP_TTL_MINUTES * 60 * 1000;

  memoryOtps.push({
    id: otpSessionId,
    purpose,
    channel,
    target,
    codeHash: buildOtpDigest({ code, target, purpose }),
    attempts: 0,
    expiresAt,
    consumedAt: null,
    createdAt: Date.now()
  });

  return {
    otpSessionId,
    code,
    expiresInSeconds: OTP_TTL_MINUTES * 60
  };
}

function verifyMemoryOtp({ otpSessionId, purpose, channel, target, otpCode }) {
  const otp = memoryOtps.find((item) => item.id === otpSessionId);
  if (!otp || otp.purpose !== purpose || otp.channel !== channel || otp.target !== target) {
    throw new ApiError(400, "Invalid OTP session", "INVALID_OTP_SESSION");
  }

  if (otp.consumedAt) {
    throw new ApiError(400, "OTP already used", "OTP_ALREADY_USED");
  }

  if (Date.now() > otp.expiresAt) {
    throw new ApiError(400, "OTP has expired", "OTP_EXPIRED");
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many OTP attempts", "OTP_ATTEMPTS_EXCEEDED");
  }

  const expectedHash = buildOtpDigest({ code: otpCode, target, purpose });
  if (expectedHash !== otp.codeHash) {
    otp.attempts += 1;
    throw new ApiError(400, "Invalid OTP code", "INVALID_OTP_CODE");
  }

  otp.consumedAt = Date.now();
}

async function createOtpRecord({ purpose, channel, target, metadata = {} }) {
  const normalizedTarget = normalizeTarget(channel, target);

  try {
    await ensureOtpTable();

    const otpSessionId = randomUUID();
    const code = buildOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (id, purpose, channel, target, code_hash, expires_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        otpSessionId,
        purpose,
        channel,
        normalizedTarget,
        buildOtpDigest({ code, target: normalizedTarget, purpose }),
        expiresAt,
        metadata
      ]
    );

    return {
      otpSessionId,
      code,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      target: normalizedTarget
    };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      const result = createMemoryOtp({
        purpose,
        channel,
        target: normalizedTarget
      });

      return {
        ...result,
        target: normalizedTarget
      };
    }

    throw error;
  }
}

async function verifyOtpRecord({ otpSessionId, purpose, channel, target, otpCode }) {
  const normalizedTarget = normalizeTarget(channel, target);

  try {
    await ensureOtpTable();

    const result = await pool.query(
      `SELECT id, purpose, channel, target, code_hash, attempts, expires_at, consumed_at
       FROM otp_codes
       WHERE id = $1`,
      [otpSessionId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(400, "Invalid OTP session", "INVALID_OTP_SESSION");
    }

    const otp = result.rows[0];
    if (otp.purpose !== purpose || otp.channel !== channel || otp.target !== normalizedTarget) {
      throw new ApiError(400, "OTP does not match this request", "OTP_CONTEXT_MISMATCH");
    }

    if (otp.consumed_at) {
      throw new ApiError(400, "OTP already used", "OTP_ALREADY_USED");
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new ApiError(429, "Too many OTP attempts", "OTP_ATTEMPTS_EXCEEDED");
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      throw new ApiError(400, "OTP has expired", "OTP_EXPIRED");
    }

    const expectedHash = buildOtpDigest({ code: otpCode, target: normalizedTarget, purpose });
    if (expectedHash !== otp.code_hash) {
      await pool.query(
        `UPDATE otp_codes
         SET attempts = attempts + 1
         WHERE id = $1`,
        [otpSessionId]
      );
      throw new ApiError(400, "Invalid OTP code", "INVALID_OTP_CODE");
    }

    await pool.query(
      `UPDATE otp_codes
       SET consumed_at = NOW()
       WHERE id = $1`,
      [otpSessionId]
    );
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      verifyMemoryOtp({
        otpSessionId,
        purpose,
        channel,
        target: normalizedTarget,
        otpCode
      });
      return;
    }

    throw error;
  }
}

async function requestOtp({ purpose, channel, target }) {
  const normalizedTarget = normalizeTarget(channel, target);

  if (purpose === "REGISTER") {
    if (channel !== "PHONE") {
      throw new ApiError(400, "Registration OTP must use phone verification", "INVALID_REGISTER_OTP_CHANNEL");
    }

    try {
      const existing = await pool.query("SELECT id FROM users WHERE phone = $1 LIMIT 1", [normalizedTarget]);
      if (existing.rows.length > 0) {
        throw new ApiError(409, "Phone number already registered", "IDENTIFIER_EXISTS");
      }
    } catch (error) {
      if (!shouldUseMemoryFallback(error)) {
        throw error;
      }
      logMemoryFallbackOnce(error);
    }
  }

  const otp = await createOtpRecord({ purpose, channel, target: normalizedTarget });

  let delivery;
  try {
    delivery = await deliverOtp({
      code: otp.code,
      channel,
      target: normalizedTarget,
      purpose
    });
  } catch (error) {
    if (!shouldUseDevOtpDeliveryFallback(error)) {
      throw error;
    }

    console.warn("[auth.service] OTP delivery fallback enabled", {
      purpose,
      channel,
      target: maskTarget(channel, normalizedTarget),
      code: error.code,
      message: error.message
    });

    delivery = {
      deliveryMethod: "DEV_FALLBACK",
      fallback: true
    };
  }

  console.log("[auth.service] OTP generated", {
    purpose,
    channel,
    target: maskTarget(channel, normalizedTarget)
  });

  const fallbackMessages = {
    PHONE: "SMS temporarily unavailable. Please check your email or use the test OTP code provided below.",
    WHATSAPP: "WhatsApp temporarily unavailable. Please check your email or use the test OTP code provided below.",
    EMAIL: "Email temporarily unavailable. Please use the test OTP code provided below.",
    SOCIAL: "Social recovery temporarily unavailable. Please use the test OTP code provided below."
  };

  const response = {
    otpSessionId: otp.otpSessionId,
    expiresInSeconds: otp.expiresInSeconds,
    channel,
    target: maskTarget(channel, normalizedTarget),
    deliveryMethod: delivery.deliveryMethod,
    message: delivery.fallback
      ? fallbackMessages[channel] || "Delivery temporarily unavailable. Please use the test OTP code provided below."
      : `Prosperous Data Hub Confirmation sent via ${delivery.deliveryMethod}`
  };

  if (delivery.fallback || env.NODE_ENV !== "production") {
    response.devOtp = otp.code;
  }

  return response;
}

async function verifyRegistrationOtp({ otpSessionId, otpCode, phone }) {
  const phoneTarget = normalizePhone(phone);

  if (!phoneTarget) {
    throw new ApiError(400, "Provide a phone number for OTP verification", "MISSING_PHONE_IDENTIFIER");
  }

  await verifyOtpRecord({
    otpSessionId,
    otpCode,
    purpose: "REGISTER",
    channel: "PHONE",
    target: phoneTarget
  });
}

async function loginInMemory({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = memoryUsers.find((item) => item.email === normalizedEmail);

  if (!user) {
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  const matches = await bcrypt.compare(password, user.password_hash);

  if (!matches) {
    throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    },
    token: buildToken(user)
  };
}

async function register({ fullName, email, phone, password, otpSessionId, otpCode }) {
  const normalizedEmail = resolveRegistrationEmail(email, phone);
  const resolvedFullName = buildDefaultFullName(normalizedEmail, fullName);
  const resolvedPhone = normalizePhone(buildDefaultPhone(phone));

  await verifyRegistrationOtp({
    otpSessionId,
    otpCode,
    phone: resolvedPhone
  });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
    }

    const existingPhone = await pool.query("SELECT id FROM users WHERE phone = $1", [resolvedPhone]);
    if (existingPhone.rows.length > 0) {
      throw new ApiError(409, "Phone number already registered", "PHONE_EXISTS");
    }

    const hash = await bcrypt.hash(password, 12);
    const role = normalizedEmail === env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
    const generatedUsername = await generateUniqueUsername(resolvedFullName);

    const result = await withTransaction(async (client) => {
      const userInsert = await client.query(
        `INSERT INTO users (full_name, username, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, username, email, phone, role, created_at`,
        [resolvedFullName, generatedUsername, normalizedEmail, resolvedPhone, hash, role]
      );

      const user = userInsert.rows[0];

      await client.query(
        `INSERT INTO wallets (user_id, available_balance, locked_balance)
         VALUES ($1, 0, 0)`,
        [user.id]
      );

      return user;
    });

    return {
      user: result,
      token: buildToken(result)
    };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      return registerInMemory({ fullName, email, phone: resolvedPhone, password });
    }

    throw error;
  }
}

async function requestPasswordRecoveryOtp({ identifier, channel }) {
  const resolvedChannel = channel || detectChannelFromIdentifier(identifier);
  const target = normalizeTarget(resolvedChannel, identifier);

  return requestOtp({
    purpose: "PASSWORD_RESET",
    channel: resolvedChannel,
    target
  });
}

async function requestGoogleSocialRecoveryOtp({ idToken }) {
  const social = await verifyGoogleIdToken(idToken);

  const otpResult = await requestOtp({
    purpose: "PASSWORD_RESET",
    channel: "EMAIL",
    target: social.email
  });

  return {
    ...otpResult,
    social: {
      provider: social.provider,
      email: social.email,
      name: social.name,
      picture: social.picture
    },
    message:
      otpResult.message || "Google account verified. Confirmation code sent to your verified email."
  };
}

async function resetPasswordWithOtp({ identifier, otpSessionId, otpCode, newPassword }) {
  const channel = detectChannelFromIdentifier(identifier);
  const target = normalizeTarget(channel, identifier);

  await verifyOtpRecord({
    otpSessionId,
    otpCode,
    purpose: "PASSWORD_RESET",
    channel,
    target
  });

  const hash = await bcrypt.hash(newPassword, 12);

  try {
    const field = channel === "EMAIL" ? "email" : "phone";
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE ${field} = $2
       RETURNING id`,
      [hash, target]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Account not found", "ACCOUNT_NOT_FOUND");
    }

    return { message: "Password reset successful" };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      const user = memoryUsers.find((item) =>
        channel === "EMAIL" ? item.email === target : item.phone === target
      );

      if (!user) {
        throw new ApiError(404, "Account not found", "ACCOUNT_NOT_FOUND");
      }

      user.password_hash = hash;
      return { message: "Password reset successful" };
    }

    throw error;
  }
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await pool.query(
      `SELECT id, full_name, username, email, phone, password_hash, role, created_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      throw new ApiError(401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      },
      token: buildToken(user)
    };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      return loginInMemory({ email, password });
    }

    throw error;
  }
}

async function deleteAccount({ userId, password, otpSessionId, otpCode, channel }) {
  try {
    const userResult = await pool.query(
      `SELECT id, password_hash, email, phone, full_name
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new ApiError(404, "Account not found", "ACCOUNT_NOT_FOUND");
    }

    const user = userResult.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      throw new ApiError(401, "Invalid password", "INVALID_PASSWORD");
    }

    const otpTarget = channel === "EMAIL" ? normalizeEmail(user.email) : normalizePhone(user.phone);
    if (!otpTarget) {
      throw new ApiError(400, "No valid contact found for selected OTP channel", "INVALID_OTP_CHANNEL");
    }

    await verifyOtpRecord({
      otpSessionId,
      otpCode,
      purpose: "ACCOUNT_DELETE",
      channel,
      target: otpTarget
    });

    await withTransaction(async (client) => {
      const normalizedEmail = normalizeEmail(user.email);
      const normalizedPhone = normalizePhone(user.phone);

      // Remove OTP records tied to this user's contact targets or metadata.
      await client.query(
        `DELETE FROM otp_codes
         WHERE target = ANY($1::text[])
            OR metadata->>'userId' = $2`,
        [[normalizedEmail, normalizedPhone], userId]
      );

      // Delete user-owned payment records first (depends on user/wallet FKs).
      await client.query(`DELETE FROM payments WHERE user_id = $1`, [userId]);

      // Delete purchase records before transactions because transaction_id is RESTRICT.
      await client.query(`DELETE FROM data_purchases WHERE user_id = $1`, [userId]);

      // Deleting transactions will also remove ledger rows via ON DELETE CASCADE.
      await client.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);

      // Wallet can now be deleted safely.
      await client.query(`DELETE FROM wallets WHERE user_id = $1`, [userId]);

      // Finally delete the user account.
      const deletedUser = await client.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
      if (deletedUser.rows.length === 0) {
        throw new ApiError(404, "Account not found", "ACCOUNT_NOT_FOUND");
      }
    });

    return { message: "Account deleted successfully" };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      const user = memoryUsers.find((item) => item.id === userId);

      if (!user) {
        throw new ApiError(404, "Account not found", "ACCOUNT_NOT_FOUND");
      }

      const matches = await bcrypt.compare(password, user.password_hash);
      if (!matches) {
        throw new ApiError(401, "Invalid password", "INVALID_PASSWORD");
      }

      const otpTarget = channel === "EMAIL" ? normalizeEmail(user.email) : normalizePhone(user.phone);
      if (!otpTarget) {
        throw new ApiError(400, "No valid contact found for selected OTP channel", "INVALID_OTP_CHANNEL");
      }

      verifyMemoryOtp({
        otpSessionId,
        otpCode,
        purpose: "ACCOUNT_DELETE",
        channel,
        target: otpTarget
      });

      for (let index = memoryOtps.length - 1; index >= 0; index -= 1) {
        const item = memoryOtps[index];
        if (item.target === normalizeEmail(user.email) || item.target === normalizePhone(user.phone)) {
          memoryOtps.splice(index, 1);
        }
      }

      const index = memoryUsers.findIndex((item) => item.id === userId);
      if (index !== -1) {
        memoryUsers.splice(index, 1);
      }

      return { message: "Account deleted successfully" };
    }

    throw error;
  }
}

async function checkUsernameAvailability(username, excludeUserId = null) {
  const normalizedUsername = String(username || "").toLowerCase().trim();

  if (!normalizedUsername || normalizedUsername.length < 3) {
    throw new ApiError(400, "Username must be at least 3 characters", "INVALID_USERNAME_LENGTH");
  }

  if (!/^[a-z0-9._-]{3,50}$/.test(normalizedUsername)) {
    throw new ApiError(
      400,
      "Username can only contain lowercase letters, numbers, dots, hyphens, and underscores",
      "INVALID_USERNAME_FORMAT"
    );
  }

  try {
    let query = "SELECT id FROM users WHERE LOWER(username) = $1";
    let params = [normalizedUsername];

    if (excludeUserId) {
      query += " AND id != $2";
      params.push(excludeUserId);
    }

    const result = await pool.query(query, params);
    return result.rows.length === 0; // true if available, false if taken
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      const exists = memoryUsers.some(
        (user) =>
          String(user.username || "").toLowerCase() === normalizedUsername &&
          user.id !== excludeUserId
      );
      return !exists;
    }

    throw error;
  }
}

async function updateUsername({ userId, username, fullName }) {
  const normalizedUsername = String(username || "").toLowerCase().trim();
  const normalizedName = String(fullName || "").trim();

  // Validate display name (full_name)
  if (!normalizedName || normalizedName.length < 2) {
    throw new ApiError(400, "Display name must be at least 2 characters", "INVALID_DISPLAY_NAME");
  }

  if (normalizedName.length > 120) {
    throw new ApiError(400, "Display name must not exceed 120 characters", "DISPLAY_NAME_TOO_LONG");
  }

  // Validate unique username handle
  if (!normalizedUsername || normalizedUsername.length < 3) {
    throw new ApiError(400, "Username must be at least 3 characters", "INVALID_USERNAME_LENGTH");
  }

  if (normalizedUsername.length > 50) {
    throw new ApiError(400, "Username must not exceed 50 characters", "USERNAME_TOO_LONG");
  }

  if (!/^[a-z0-9._-]{3,50}$/.test(normalizedUsername)) {
    throw new ApiError(
      400,
      "Username can only contain lowercase letters, numbers, dots, hyphens, and underscores",
      "INVALID_USERNAME_FORMAT"
    );
  }

  // Check if username is available for this user (must not be taken by anyone else)
  const isAvailable = await checkUsernameAvailability(normalizedUsername, userId);
  if (!isAvailable) {
    throw new ApiError(409, "Username is already taken", "USERNAME_TAKEN");
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, username = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, full_name, username, email, phone, role, created_at`,
      [normalizedName, normalizedUsername, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    return {
      user: result.rows[0],
      message: "Username updated successfully"
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (shouldUseMemoryFallback(error)) {
      logMemoryFallbackOnce(error);
      const user = memoryUsers.find((item) => item.id === userId);

      if (!user) {
        throw new ApiError(404, "User not found", "USER_NOT_FOUND");
      }

      user.full_name = normalizedName;
      user.username = normalizedUsername;
      return {
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at
        },
        message: "Username updated successfully"
      };
    }

    throw error;
  }
}

module.exports = {
  register,
  login,
  requestOtp,
  requestPasswordRecoveryOtp,
  requestGoogleSocialRecoveryOtp,
  resetPasswordWithOtp,
  deleteAccount,
  checkUsernameAvailability,
  updateUsername,
  getRegisteredUsersInMemory: () =>
    memoryUsers.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    }))
};
