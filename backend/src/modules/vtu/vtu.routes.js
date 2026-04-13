const express = require("express");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const { idempotencyGuard, memoryIdempotencyStore } = require("../../middleware/idempotency");
const pool = require("../../db/pool");
const { buyDataSchema } = require("./vtu.validation");
const vtuService = require("./vtu.service");

function shouldUseMemoryFallback(error) {
  if (!error) {
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

const router = express.Router();

router.get("/bundles", authRequired, (_req, res) => {
  const { DATA_BUNDLES } = require("../../utils/constants");
  return res.json({ success: true, bundles: DATA_BUNDLES });
});

router.post("/buy", authRequired, idempotencyGuard, validate(buyDataSchema), async (req, res, next) => {
  try {
    const result = await vtuService.buyData({
      userId: req.user.sub,
      ...req.validated.body,
      idempotencyKey: req.idempotencyKey
    });

    const payload = { success: true, ...result };

    if (req.idempotencyStorage === "memory") {
      memoryIdempotencyStore.set(req.idempotencyKey, {
        response_status: 200,
        response_payload: payload
      });
    } else {
      try {
        await pool.query(
          `INSERT INTO idempotency_keys (key, response_status, response_payload)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO NOTHING`,
          [req.idempotencyKey, 200, payload]
        );
      } catch (persistError) {
        if (!shouldUseMemoryFallback(persistError)) {
          throw persistError;
        }

        memoryIdempotencyStore.set(req.idempotencyKey, {
          response_status: 200,
          response_payload: payload
        });
      }
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
