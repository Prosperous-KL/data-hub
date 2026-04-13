const axios = require("axios");
const { randomUUID } = require("crypto");
const { sendPurchaseSms } = require("./smsService");

const NETWORK_ALIASES = {
  mtn: "MTN",
  mtngh: "MTN",
  vodafone: "Vodafone",
  telecel: "Vodafone",
  airteltigo: "AirtelTigo",
  airtel_tigo: "AirtelTigo",
  "airtel-tigo": "AirtelTigo"
};

function createHttpError(statusCode, code, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
}

function normalizePhoneNumber(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\s+/g, "");
  if (!/^233\d{9}$/.test(digits)) {
    throw createHttpError(
      400,
      "INVALID_PHONE_NUMBER",
      "phoneNumber must be in Ghana format: 233XXXXXXXXX"
    );
  }

  return digits;
}

function normalizeNetwork(network) {
  const value = String(network || "").trim().toLowerCase();
  const canonical = NETWORK_ALIASES[value] || network;

  if (!["MTN", "Vodafone", "AirtelTigo"].includes(canonical)) {
    throw createHttpError(
      400,
      "INVALID_NETWORK",
      "network must be one of MTN, Vodafone, or AirtelTigo"
    );
  }

  return canonical;
}

function normalizeBundle(bundle) {
  const value = String(bundle || "").trim();
  if (!value) {
    throw createHttpError(400, "INVALID_BUNDLE", "bundle is required");
  }
  return value;
}

function normalizeAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw createHttpError(400, "INVALID_AMOUNT", "amount must be a positive number");
  }
  return numericAmount;
}

function validatePurchaseInput(input) {
  return {
    phoneNumber: normalizePhoneNumber(input.phoneNumber),
    network: normalizeNetwork(input.network),
    bundle: normalizeBundle(input.bundle),
    amount: normalizeAmount(input.amount)
  };
}

async function simulatePaymentSuccess({ phoneNumber, network, bundle, amount }) {
  const paymentReference = `PAY-${randomUUID()}`;
  console.log("[payment] simulated payment success", {
    paymentReference,
    phoneNumber,
    network,
    bundle,
    amount
  });

  return {
    status: "SUCCESS",
    reference: paymentReference,
    message: "Payment approved"
  };
}

async function callVtuApi({ phoneNumber, network, bundle, amount }) {
  const baseUrl = String(process.env.VTU_BASE_URL || "").trim().replace(/\/+$/, "");
  const apiKey = String(process.env.VTU_API_KEY || "").trim();

  if (!baseUrl || !apiKey) {
    throw createHttpError(
      500,
      "VTU_CONFIG_ERROR",
      "VTU_API_KEY and VTU_BASE_URL must be configured"
    );
  }

  const payload = {
    phone: phoneNumber,
    network,
    bundle,
    amount
  };

  const response = await axios.post(`${baseUrl}/purchase`, payload, {
    timeout: 20000,
    validateStatus: () => true,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    }
  });

  const data = response.data || {};
  const success = response.status >= 200 && response.status < 300 && data.success !== false;

  if (!success) {
    throw createHttpError(
      502,
      "VTU_PURCHASE_FAILED",
      data.message || data.error || `VTU request failed with status ${response.status}`,
      { providerResponse: data }
    );
  }

  console.log("[vtu] purchase success", {
    phoneNumber,
    network,
    bundle,
    amount,
    providerReference: data.reference || data.providerReference || null
  });

  return {
    providerReference: data.reference || data.providerReference || null,
    providerResponse: data
  };
}

async function buyData(input) {
  const purchase = validatePurchaseInput(input);

  const payment = await simulatePaymentSuccess(purchase);
  const vtuResult = await callVtuApi(purchase);

  let smsResult = null;
  try {
    smsResult = await sendPurchaseSms({
      phoneNumber: purchase.phoneNumber,
      bundle: purchase.bundle
    });
  } catch (smsError) {
    console.error("[sms] SMS confirmation failed", {
      phoneNumber: purchase.phoneNumber,
      error: smsError.message,
      code: smsError.code || null
    });
    smsResult = {
      success: false,
      message: smsError.message,
      code: smsError.code || "SMS_DELIVERY_FAILED"
    };
  }

  return {
    message: "Data bundle purchase completed",
    payment,
    purchase: {
      phoneNumber: purchase.phoneNumber,
      network: purchase.network,
      bundle: purchase.bundle,
      amount: purchase.amount,
      providerReference: vtuResult.providerReference
    },
    sms: smsResult
  };
}

module.exports = {
  buyData,
  validatePurchaseInput,
  createHttpError
};