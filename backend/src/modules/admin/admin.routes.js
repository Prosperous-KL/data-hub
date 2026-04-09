const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { authRequired, requireRole } = require("../../middleware/auth");
const { manualRefundSchema } = require("./admin.validation");
const adminService = require("./admin.service");

const router = express.Router();

const querySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(500).optional()
  })
});

router.use(authRequired, requireRole("admin"));

router.get("/users", validate(querySchema), async (req, res, next) => {
  try {
    const users = await adminService.listUsers(req.validated.query.limit || 100);
    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
});

router.get("/transactions", validate(querySchema), async (req, res, next) => {
  try {
    const transactions = await adminService.listTransactions(req.validated.query.limit || 200);
    return res.json({ success: true, transactions });
  } catch (error) {
    return next(error);
  }
});

router.get("/transactions/failed", validate(querySchema), async (req, res, next) => {
  try {
    const transactions = await adminService.listFailedTransactions(req.validated.query.limit || 200);
    return res.json({ success: true, transactions });
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
