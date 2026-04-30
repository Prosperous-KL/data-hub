const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate");
const { authRequired, requireRole } = require("../../middleware/auth");
const storeService = require("./store.service");

const router = express.Router();

const productSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priceCents: z.coerce.number().int().min(0),
    currency: z.string().default("GHS"),
    stock: z.coerce.number().int().min(0).default(0)
  })
});

const orderSchema = z.object({
  body: z.object({
    phone: z.string().min(5),
    product: z.string().min(1),
    paidCents: z.coerce.number().int().min(0),
    profitCents: z.coerce.number().int().min(0).default(0),
    network: z.enum(["MTN", "TELECEL", "AIRTELTIGO"]),
    status: z.enum(["PAID", "PENDING", "FAILED", "FULFILLED", "CANCELLED"]).default("PAID")
  })
});

router.use(authRequired);

router.get("/products", async (req, res, next) => {
  try {
    const products = await storeService.listProducts(req.query.limit || 100);
    return res.json({ success: true, products });
  } catch (err) {
    return next(err);
  }
});

router.post("/products", requireRole("seller"), validate(productSchema), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const prod = await storeService.createProduct({ sellerId, ...req.validated.body });
    return res.status(201).json({ success: true, product: prod });
  } catch (err) {
    return next(err);
  }
});

router.put("/products/:id", requireRole("seller"), validate(productSchema), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const product = await storeService.updateProduct({ sellerId, productId: req.params.id, ...req.validated.body });
    return res.json({ success: true, product });
  } catch (err) {
    return next(err);
  }
});

router.get("/orders", requireRole("seller"), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const q = req.query.q || null;
    const status = req.query.status || "ALL";
    const network = req.query.network || "ALL";
    const orders = await storeService.listOrders({ sellerId, q, status, network, limit: req.query.limit || 200 });
    return res.json({ success: true, orders });
  } catch (err) {
    return next(err);
  }
});

router.post("/orders", requireRole("seller"), validate(orderSchema), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const order = await storeService.createOrder({ sellerId, ...req.validated.body });
    return res.status(201).json({ success: true, order });
  } catch (err) {
    return next(err);
  }
});

const withdrawalSchema = z.object({ body: z.object({ amountCents: z.coerce.number().int().min(100), network: z.string().min(1), momoNumber: z.string().min(5) }) });

router.post("/withdrawals", requireRole("seller"), validate(withdrawalSchema), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const w = await storeService.requestWithdrawal({ sellerId, ...req.validated.body });
    return res.status(201).json({ success: true, withdrawal: w });
  } catch (err) {
    return next(err);
  }
});

router.get("/withdrawals", requireRole("seller"), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const list = await storeService.listWithdrawals({ sellerId, limit: req.query.limit || 100 });
    return res.json({ success: true, withdrawals: list });
  } catch (err) {
    return next(err);
  }
});

router.get("/settings", requireRole("seller"), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const settings = await storeService.getSellerSettings(sellerId);
    return res.json({ success: true, settings });
  } catch (err) {
    return next(err);
  }
});

router.post("/settings", requireRole("seller"), async (req, res, next) => {
  try {
    const sellerId = req.user.sub;
    const settings = await storeService.updateSellerSettings(sellerId, req.body || {});
    return res.json({ success: true, settings });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
