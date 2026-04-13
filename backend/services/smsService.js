const axios = require("axios");

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

function getHubtelConfig() {
  const clientId = String(process.env.HUBTEL_CLIENT_ID || process.env.HUBTEL_SMS_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.HUBTEL_CLIENT_SECRET || process.env.HUBTEL_SMS_CLIENT_SECRET || "").trim();
  const baseUrl = String(process.env.HUBTEL_BASE_URL || process.env.HUBTEL_SMS_BASE_URL || "https://smsc.hubtel.com/v1/messages/send").trim();
  const senderId = String(process.env.HUBTEL_FROM || process.env.HUBTEL_SMS_FROM || "Prosperous").trim();

  if (!clientId || !clientSecret || !baseUrl || !senderId) {
    throw createHttpError(
      500,
      "SMS_CONFIG_ERROR",
      "Hubtel SMS config is incomplete. Set HUBTEL_CLIENT_ID, HUBTEL_CLIENT_SECRET, HUBTEL_BASE_URL, and HUBTEL_FROM."
    );
  }

  return {
    clientId,
    clientSecret,
    baseUrl,
    senderId
  };
}

function buildSmsContent({ bundle }) {
  return `Your data purchase of ${bundle} was successful. Thank you!`;
}

async function sendPurchaseSms({ phoneNumber, bundle }) {
  const { clientId, clientSecret, baseUrl, senderId } = getHubtelConfig();
  const to = normalizePhoneNumber(phoneNumber);
  const content = buildSmsContent({ bundle });

  console.log("[sms] sending Hubtel SMS", {
    to,
    senderId,
    content
  });

  const response = await axios.get(baseUrl, {
    timeout: 20000,
    params: {
      clientid: clientId,
      clientsecret: clientSecret,
      from: senderId,
      to,
      content
    },
    validateStatus: () => true
  });

  const data = response.data || {};
  const ok = response.status >= 200 && response.status < 300;

  if (!ok) {
    throw createHttpError(
      502,
      "SMS_SEND_FAILED",
      data.message || data.error || `SMS request failed with status ${response.status}`,
      { providerResponse: data }
    );
  }

  console.log("[sms] Hubtel SMS sent", {
    to,
    response: data
  });

  return {
    success: true,
    providerResponse: data
  };
}

module.exports = {
  sendPurchaseSms
};