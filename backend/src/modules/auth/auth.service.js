const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { withTransaction } = require("../../db/tx");
const pool = require("../../db/pool");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");

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

async function register({ fullName, email, phone, password }) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const hash = await bcrypt.hash(password, 12);
  const role = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

  const result = await withTransaction(async (client) => {
    const userInsert = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, created_at`,
      [fullName, email.toLowerCase(), phone, hash, role]
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
}

async function login({ email, password }) {
  const result = await pool.query(
    `SELECT id, full_name, email, phone, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
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
}

module.exports = {
  register,
  login
};
