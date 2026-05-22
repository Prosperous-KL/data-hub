import express from "express";
import { z } from "zod";
import validate from "../../middleware/validate.js";
import { authRequired } from "../../middleware/auth.js";
import * as transactionService from "./transaction.service.js";

const router = express.Router();

const listSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional()
  })
});

router.get("/", authRequired, validate(listSchema), async (req, res, next) => {
  try {
    const limit = req.validated.query.limit || 50;
    const transactions = await transactionService.getUserTransactions(req.user.sub, limit);
    return res.json({ success: true, transactions });
  } catch (error) {
    return next(error);
  }
});

export default router;
