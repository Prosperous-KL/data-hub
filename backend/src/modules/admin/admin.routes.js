const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { authRequired, requireRole } = require("../../middleware/auth");
const { manualRefundSchema } = require("./admin.validation");
const adminService = require("./admin.service");

const router = express.Router();

const querySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(500).optional().default(100),
    page: z.coerce.number().int().min(1).optional().default(1)
  })
});

router.use(authRequired, requireRole("admin"));

router.get("/users", validate(querySchema), async (req, res, next) => {
  try {
    const { limit, page } = req.validated.query;
    const result = await adminService.listUsers(limit, page);
    return res.json({ success: true, users: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
  } catch (error) {
    return next(error);
  }
});

router.get("/transactions", validate(querySchema), async (req, res, next) => {
  try {
    const { limit, page } = req.validated.query;
    const result = await adminService.listTransactions(limit, page);
    return res.json({ success: true, transactions: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
  } catch (error) {
    return next(error);
  }
});

router.get("/transactions/failed", validate(querySchema), async (req, res, next) => {
  try {
    const { limit, page } = req.validated.query;
    const result = await adminService.listFailedTransactions(limit, page);
    return res.json({ success: true, transactions: result.data, total: result.total, page: result.page, totalPages: result.totalPages });
  } catch (error) {
    return next(error);
  }
});

router.post("/refund", validate(manualRefundSchema), async (req, res, next) => {
  try {
    const refund = await adminService.manualRefund({
      ...req.validated.body,
      adminUserId: req.user.sub
    });
    return res.status(201).json({ success: true, refund });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
