import express from "express";
import { authRequired } from "../../middleware/auth.js";
import * as walletService from "./wallet.service.js";

const router = express.Router();

router.get("/balance", authRequired, async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.sub);
    return res.json({ success: true, wallet });
  } catch (error) {
    return next(error);
  }
});

export default router;
