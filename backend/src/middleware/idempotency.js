const pool = require("../db/pool");
const ApiError = require("../utils/apiError");

async function idempotencyGuard(req, res, next) {
  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!idempotencyKey) {
    return next(new ApiError(400, "x-idempotency-key header is required", "IDEMPOTENCY_REQUIRED"));
  }

  const existing = await pool.query(
    "SELECT response_status, response_payload FROM idempotency_keys WHERE key = $1",
    [idempotencyKey]
  );

  if (existing.rows.length > 0) {
    return res.status(existing.rows[0].response_status).json(existing.rows[0].response_payload);
  }

  req.idempotencyKey = idempotencyKey;
  return next();
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
  persistIdempotencyResult
};
