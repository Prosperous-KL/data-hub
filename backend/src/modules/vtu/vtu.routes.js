const express = require("express");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const { idempotencyGuard } = require("../../middleware/idempotency");
const pool = require("../../db/pool");
const { buyDataSchema } = require("./vtu.validation");
const vtuService = require("./vtu.service");

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

    await pool.query(
      `INSERT INTO idempotency_keys (key, response_status, response_payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      [req.idempotencyKey, 200, payload]
    );

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
