const express = require("express");
const { authRequired } = require("../../middleware/auth");
const walletService = require("./wallet.service");

const router = express.Router();

router.get("/balance", authRequired, async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.sub);
    return res.json({ success: true, wallet });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
