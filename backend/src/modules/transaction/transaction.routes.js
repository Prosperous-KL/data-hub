const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { authRequired } = require("../../middleware/auth");
const transactionService = require("./transaction.service");

const router = express.Router();

const listSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    page: z.coerce.number().int().min(1).optional().default(1)
  })
});

router.get("/", authRequired, validate(listSchema), async (req, res, next) => {
  try {
    const { limit, page } = req.validated.query;
    const transactions = await transactionService.getUserTransactions(req.user.sub, limit, page);
    return res.json({ success: true, transactions: transactions.data, total: transactions.total, page: transactions.page, totalPages: transactions.totalPages });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
