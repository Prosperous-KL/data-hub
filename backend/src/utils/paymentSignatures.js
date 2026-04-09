const crypto = require("crypto");
const env = require("../config/env");

function signPayload(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(left, right) {
  if (!left || !right) {
    return false;
  }
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

function canonicalBody(body) {
  return typeof body === "string" ? body : JSON.stringify(body || {});
}

function buildHubtelSignatureHeaders({ method, path, body, timestamp, nonce }) {
  const ts = timestamp || String(Date.now());
  const randomNonce = nonce || crypto.randomBytes(8).toString("hex");
  const payload = `${method.toUpperCase()}|${path}|${ts}|${randomNonce}|${canonicalBody(body)}`;
  const signature = signPayload(env.HUBTEL_SIGNING_SECRET || env.HUBTEL_CLIENT_SECRET || "", payload);

  return {
    "X-Client-Id": env.HUBTEL_CLIENT_ID,
    "X-Timestamp": ts,
    "X-Nonce": randomNonce,
    "X-Signature": signature
  };
}

function buildExpressPaySignatureHeaders({ method, path, body, timestamp }) {
  const ts = timestamp || String(Date.now());
  const payload = `${method.toUpperCase()}|${path}|${ts}|${canonicalBody(body)}`;
  const signature = signPayload(env.EXPRESSPAY_SIGNING_SECRET || env.EXPRESSPAY_API_KEY || "", payload);

  return {
    Authorization: `Bearer ${env.EXPRESSPAY_API_KEY}`,
    "X-Timestamp": ts,
    "X-Signature": signature
  };
}

function verifyHubtelCallback({ headers, rawBody }) {
  const signature = headers["x-hubtel-signature"] || headers["x-signature"];
  const expected = signPayload(env.HUBTEL_CALLBACK_SECRET || env.PAYMENT_CALLBACK_TOKEN, rawBody || "");
  return safeEqual(signature, expected);
}

function verifyExpressPayCallback({ headers, rawBody }) {
  const signature = headers["x-expresspay-signature"] || headers["x-signature"];
  const expected = signPayload(env.EXPRESSPAY_CALLBACK_SECRET || env.PAYMENT_CALLBACK_TOKEN, rawBody || "");
  return safeEqual(signature, expected);
}

function verifyCallbackSignature({ headers, rawBody, body }) {
  const mode = env.PAYMENT_CALLBACK_PROVIDER;

  if (mode === "TOKEN") {
    return headers["x-callback-token"] === env.PAYMENT_CALLBACK_TOKEN || body.signature === env.PAYMENT_CALLBACK_TOKEN;
  }

  if (mode === "HUBTEL") {
    return verifyHubtelCallback({ headers, rawBody });
  }

  if (mode === "EXPRESSPAY") {
    return verifyExpressPayCallback({ headers, rawBody });
  }

  if (verifyHubtelCallback({ headers, rawBody })) {
    return true;
  }

  if (verifyExpressPayCallback({ headers, rawBody })) {
    return true;
  }

  return headers["x-callback-token"] === env.PAYMENT_CALLBACK_TOKEN || body.signature === env.PAYMENT_CALLBACK_TOKEN;
}

module.exports = {
  signPayload,
  buildHubtelSignatureHeaders,
  buildExpressPaySignatureHeaders,
  verifyCallbackSignature
};
