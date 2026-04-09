const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { withTransaction } = require("../../db/tx");
const pool = require("../../db/pool");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");

const memoryUsers = [];
let loggedMemoryFallback = false;

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
  return email.toLowerCase().trim();
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

async function registerInMemory({ fullName, email, phone, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = memoryUsers.find((item) => item.email === normalizedEmail);

  if (existing) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const hash = await bcrypt.hash(password, 12);
  const role = normalizedEmail === env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
  const createdAt = new Date().toISOString();

  const user = {
    id: randomUUID(),
    full_name: buildDefaultFullName(normalizedEmail, fullName),
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
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    },
    token: buildToken(user)
  };
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
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    },
    token: buildToken(user)
  };
}

async function register({ fullName, email, phone, password }) {
  const normalizedEmail = normalizeEmail(email);
  const resolvedFullName = buildDefaultFullName(normalizedEmail, fullName);
  const resolvedPhone = buildDefaultPhone(phone);

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
    }

    const hash = await bcrypt.hash(password, 12);
    const role = normalizedEmail === env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

    const result = await withTransaction(async (client) => {
      const userInsert = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email, phone, role, created_at`,
        [resolvedFullName, normalizedEmail, resolvedPhone, hash, role]
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
      return registerInMemory({ fullName, email, phone, password });
    }

    throw error;
  }
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, role, created_at
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

module.exports = {
  register,
  login
};
