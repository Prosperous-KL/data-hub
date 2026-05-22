import express from "express";
import { authRequired } from "../../middleware/auth.js";
import validate from "../../middleware/validate.js";
import { idempotencyGuard } from "../../middleware/idempotency.js";
import pool from "../../db/pool.js";
import ApiError from "../../utils/apiError.js";
import { initiatePaymentSchema, callbackSchema } from "./payment.validation.js";
import * as paymentService from "./payment.service.js";
import { verifyCallbackSignature } from "../../utils/paymentSignatures.js";

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

export default router;
