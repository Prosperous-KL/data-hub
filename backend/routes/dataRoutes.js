const express = require("express");
const { buyData } = require("../services/vtuService");

const router = express.Router();

function validatePayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("Request body is required");
    return errors;
  }

  const { phoneNumber, network, bundle, amount } = payload;

  if (!phoneNumber) {
    errors.push("phoneNumber is required");
  }

  if (!network) {
    errors.push("network is required");
  }

  if (!bundle) {
    errors.push("bundle is required");
  }

  if (amount === undefined || amount === null || amount === "") {
    errors.push("amount is required");
  }

  return errors;
}

async function handleBuyData(req, res, next) {
  try {
    const errors = validatePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        errors
      });
    }

    const result = await buyData(req.body);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

router.post("/buy-data", handleBuyData);
router.post("/api/data/buy", handleBuyData);

module.exports = router;