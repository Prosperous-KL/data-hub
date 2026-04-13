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
  const normalized = String(phoneNumber || "").replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) {
    return normalized;
  }

  if (normalized.startsWith("233")) {
    return `+${normalized}`;
  }

  if (normalized.startsWith("0")) {
    return `+233${normalized.slice(1)}`;
  }

  throw new ApiError(400, "Phone number must be a valid Ghana number", "INVALID_SMS_TARGET");
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

  await axios.get(env.HUBTEL_SMS_BASE_URL, {
    params: {
      clientsecret: env.HUBTEL_SMS_CLIENT_SECRET,
      clientid: env.HUBTEL_SMS_CLIENT_ID,
      from: env.HUBTEL_SMS_FROM,
      to,
      content
    }
  });

  return {
    deliveryMethod: "SMS"
  };
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