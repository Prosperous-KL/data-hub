const pool = require("../db/pool");
const ApiError = require("../utils/apiError");

const memoryIdempotencyStore = new Map();

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

async function idempotencyGuard(req, res, next) {
  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!idempotencyKey) {
    return next(new ApiError(400, "x-idempotency-key header is required", "IDEMPOTENCY_REQUIRED"));
  }

  try {
    const existing = await pool.query(
      "SELECT response_status, response_payload FROM idempotency_keys WHERE key = $1",
      [idempotencyKey]
    );

    if (existing.rows.length > 0) {
      return res.status(existing.rows[0].response_status).json(existing.rows[0].response_payload);
    }

    req.idempotencyKey = idempotencyKey;
    req.idempotencyStorage = "database";
    return next();
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      return next(
        new ApiError(
          503,
          "Service temporarily unavailable. Please try again shortly.",
          "SERVICE_UNAVAILABLE"
        )
      );
    }

    const existing = memoryIdempotencyStore.get(idempotencyKey);
    if (existing) {
      return res.status(existing.response_status).json(existing.response_payload);
    }

    req.idempotencyKey = idempotencyKey;
    req.idempotencyStorage = "memory";
    return next();
  }
}

async function persistIdempotencyResult(client, idempotencyKey, statusCode, payload) {
  await client.query(
    `INSERT INTO idempotency_keys (key, response_status, response_payload)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO NOTHING`,
    [idempotencyKey, statusCode, payload]
  );
}

module.exports = {
  idempotencyGuard,
  persistIdempotencyResult,
  memoryIdempotencyStore
};
