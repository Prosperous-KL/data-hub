process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123";
process.env.PAYMENT_PROVIDER = "SIMULATED";
process.env.PAYMENT_CALLBACK_TOKEN = "callback_secret_token";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";
process.env.HUBTEL_CLIENT_ID = "hubtel-client";
process.env.HUBTEL_CLIENT_SECRET = "hubtel-client-secret";
process.env.HUBTEL_SIGNING_SECRET = "hubtel-signing-secret";
process.env.EXPRESSPAY_API_KEY = "exp-key";
process.env.EXPRESSPAY_SIGNING_SECRET = "exp-signing-secret";
process.env.HUBTEL_CALLBACK_SECRET = "hubtel-callback-secret";
process.env.EXPRESSPAY_CALLBACK_SECRET = "exp-callback-secret";
process.env.PAYMENT_CALLBACK_PROVIDER = "AUTO";

const {
  signPayload,
  buildHubtelSignatureHeaders,
  buildExpressPaySignatureHeaders,
  verifyCallbackSignature
} = require("../src/utils/paymentSignatures");

describe("Payment signature helpers", () => {
  it("builds Hubtel headers with signature", () => {
    const headers = buildHubtelSignatureHeaders({
      method: "POST",
      path: "/momo/initiate",
      body: { amount: 50 },
      timestamp: "1712345678",
      nonce: "abc123"
    });

    expect(headers["X-Client-Id"]).toBe("hubtel-client");
    expect(headers["X-Timestamp"]).toBe("1712345678");
    expect(headers["X-Signature"]).toBeTruthy();
  });

  it("builds ExpressPay headers with signature", () => {
    const headers = buildExpressPaySignatureHeaders({
      method: "POST",
      path: "/momo/initiate",
      body: { amount: 10 },
      timestamp: "1712345678"
    });

    expect(headers.Authorization).toContain("Bearer exp-key");
    expect(headers["X-Signature"]).toBeTruthy();
  });

  it("verifies token callback in fallback mode", () => {
    const valid = verifyCallbackSignature({
      headers: { "x-callback-token": "callback_secret_token" },
      rawBody: JSON.stringify({ status: "SUCCESS" }),
      body: { externalReference: "PAY-1", status: "SUCCESS" }
    });

    expect(valid).toBe(true);
  });

  it("verifies Hubtel callback HMAC in auto mode", () => {
    const rawBody = JSON.stringify({ externalReference: "PAY-2", status: "SUCCESS" });
    const signature = signPayload("hubtel-callback-secret", rawBody);
    const valid = verifyCallbackSignature({
      headers: { "x-hubtel-signature": signature },
      rawBody,
      body: { externalReference: "PAY-2", status: "SUCCESS" }
    });

    expect(valid).toBe(true);
  });
});
