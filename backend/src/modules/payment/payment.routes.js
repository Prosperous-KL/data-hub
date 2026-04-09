const express = require("express");
const { authRequired } = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { idempotencyGuard } = require("../../middleware/idempotency");
const pool = require("../../db/pool");
const ApiError = require("../../utils/apiError");
const { initiatePaymentSchema, callbackSchema } = require("./payment.validation");
const paymentService = require("./payment.service");
const { verifyCallbackSignature } = require("../../utils/paymentSignatures");

const router = express.Router();

router.post(
  "/initiate",
  authRequired,
  idempotencyGuard,
  validate(initiatePaymentSchema),
  async (req, res, next) => {
    try {
      const result = await paymentService.initiatePayment({
        userId: req.user.sub,
        ...req.validated.body,
        idempotencyKey: req.idempotencyKey
      });

      const payload = { success: true, ...result };
      await pool.query(
        `INSERT INTO idempotency_keys (key, response_status, response_payload)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [req.idempotencyKey, 201, payload]
      );

      return res.status(201).json(payload);
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/callback", validate(callbackSchema), async (req, res, next) => {
  try {
    const verified = verifyCallbackSignature({
      headers: req.headers,
      rawBody: req.rawBody,
      body: req.validated.body
    });

    if (!verified) {
      throw new ApiError(401, "Invalid callback signature", "INVALID_CALLBACK_SIGNATURE");
    }

    const result = await paymentService.handleCallback(req.validated.body);

    return res.json({
      success: true,
      message: result.alreadyProcessed ? "Callback already processed" : "Callback processed",
      payment: result.payment
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
