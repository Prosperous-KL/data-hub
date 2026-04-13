const axios = require("axios");
const nodemailer = require("nodemailer");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");

let gmailTransporter = null;

function buildConfirmationText(code, purpose) {
  return [
    "Prosperous Data Hub Confirmation",
    "",
    `Your authentication code is ${code}.`,
    `Purpose: ${purpose}`,
    "This code expires in 10 minutes."
  ].join("\n");
}

function buildConfirmationHtml(code, purpose) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2>Prosperous Data Hub Confirmation</h2>
      <p>Your authentication code is <strong>${code}</strong>.</p>
      <p>Purpose: ${purpose}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
}

function getGmailTransporter() {
  if (gmailTransporter) {
    return gmailTransporter;
  }

  if (!env.SMTP_GMAIL_USER || !env.SMTP_GMAIL_APP_PASSWORD) {
    throw new ApiError(500, "Gmail SMTP is not configured", "EMAIL_DELIVERY_NOT_CONFIGURED");
  }

  gmailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.SMTP_GMAIL_USER,
      pass: env.SMTP_GMAIL_APP_PASSWORD
    }
  });

  return gmailTransporter;
}

function normalizeHubtelPhoneNumber(phoneNumber) {
  // Remove all non-digit and non-plus characters
  const normalized = String(phoneNumber || "")
    .replace(/[\s-().]/g, "")
    .trim();

  if (!normalized) {
    throw new ApiError(400, "Phone number is required", "INVALID_SMS_TARGET");
  }

  // Already international format with +
  if (normalized.startsWith("+")) {
    const withoutPlus = normalized.slice(1);
    if (!/^\d{12,13}$/.test(withoutPlus)) {
      throw new ApiError(
        400,
        "Phone number must be valid international format",
        "INVALID_SMS_TARGET"
      );
    }
    return normalized;
  }

  // 233 prefix (Ghana country code without +)
  if (normalized.startsWith("233")) {
    if (!/^233\d{9}$/.test(normalized)) {
      throw new ApiError(
        400,
        "Ghana phone number must be 10 digits after 233",
        "INVALID_SMS_TARGET"
      );
    }
    return `+${normalized}`;
  }

  // 0 prefix (local Ghana format)
  if (normalized.startsWith("0")) {
    if (!/^0\d{9}$/.test(normalized)) {
      throw new ApiError(
        400,
        "Ghana phone number must be 10 digits starting with 0",
        "INVALID_SMS_TARGET"
      );
    }
    return `+233${normalized.slice(1)}`;
  }

  // No recognized prefix
  throw new ApiError(
    400,
    "Phone number must be Ghana format: +233..., 233..., or 0...",
    "INVALID_SMS_TARGET"
  );
}

async function sendGmailOtp({ code, target, purpose }) {
  const transporter = getGmailTransporter();

  await transporter.sendMail({
    from: `Prosperous Data Hub <${env.SMTP_GMAIL_USER}>`,
    to: target,
    subject: "Prosperous Data Hub Confirmation",
    text: buildConfirmationText(code, purpose),
    html: buildConfirmationHtml(code, purpose)
  });

  return {
    deliveryMethod: "Gmail"
  };
}

async function sendHubtelSmsOtp({ code, target, purpose }) {
  if (!env.HUBTEL_SMS_CLIENT_ID || !env.HUBTEL_SMS_CLIENT_SECRET || !env.HUBTEL_SMS_FROM) {
    throw new ApiError(500, "Hubtel SMS is not configured", "SMS_DELIVERY_NOT_CONFIGURED");
  }

  const to = normalizeHubtelPhoneNumber(target);
  const content = buildConfirmationText(code, purpose);

  try {
    // Hubtel API supports both GET and POST - using GET for simplicity
    // For production, consider POST: https://smsc.hubtel.com/v1/messages/send
    const response = await axios.get(env.HUBTEL_SMS_BASE_URL, {
      params: {
        clientsecret: env.HUBTEL_SMS_CLIENT_SECRET,
        clientid: env.HUBTEL_SMS_CLIENT_ID,
        from: env.HUBTEL_SMS_FROM,
        to,
        content
      },
      timeout: 15000,
      validateStatus: () => true
    });

    const data = response.data || {};
    const isSuccess = response.status >= 200 && response.status < 300;

    if (!isSuccess) {
      console.error("[otpDelivery] Hubtel SMS failed", {
        status: response.status,
        to,
        response: data
      });

      throw new ApiError(
        502,
        data.message || data.error || "Failed to send SMS",
        "SMS_DELIVERY_FAILED",
        data
      );
    }

    console.log("[otpDelivery] Hubtel SMS sent successfully", {
      to,
      messageId: data.MessageId || data.response_code
    });

    return {
      deliveryMethod: "SMS",
      provider: "Hubtel",
      messageId: data.MessageId || data.response_code
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error("[otpDelivery] Hubtel SMS error", {
      message: error.message,
      to,
      code: error.code
    });

    throw new ApiError(
      502,
      "Failed to send SMS via Hubtel",
      "SMS_PROVIDER_ERROR",
      { originalError: error.message }
    );
  }
}

async function sendAuthOtp({ code, channel, target, purpose }) {
  if (channel === "EMAIL") {
    return sendGmailOtp({ code, target, purpose });
  }

  if (channel === "PHONE") {
    return sendHubtelSmsOtp({ code, target, purpose });
  }

  throw new ApiError(400, "Unsupported OTP delivery channel", "INVALID_OTP_CHANNEL");
}

module.exports = {
  sendAuthOtp
};