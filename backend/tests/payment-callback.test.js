process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123";
process.env.PAYMENT_PROVIDER = "SIMULATED";
process.env.PAYMENT_CALLBACK_TOKEN = "callback_secret_token";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";
process.env.PAYMENT_CALLBACK_PROVIDER = "TOKEN";

import { jest } from "@jest/globals";

// Mock the payment service before importing the app so the mock is applied
await jest.unstable_mockModule("../src/modules/payment/payment.service.js", () => ({
  __esModule: true,
  handleCallback: jest.fn()
}));

const request = (await import("supertest")).default;
const app = (await import("../src/app.js")).default;
const paymentService = (await import("../src/modules/payment/payment.service.js"));

describe("Payment callback security", () => {
  it("rejects callback with invalid signature", async () => {
    const response = await request(app).post("/api/payment/callback").send({
      externalReference: "PAY-123",
      status: "SUCCESS"
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe("INVALID_CALLBACK_SIGNATURE");
  });

  it("accepts callback with token and processes payment", async () => {
    paymentService.handleCallback.mockResolvedValue({
      alreadyProcessed: false,
      payment: { id: "pay-1", status: "success" }
    });

    const response = await request(app)
      .post("/api/payment/callback")
      .set("x-callback-token", "callback_secret_token")
      .send({
        externalReference: "PAY-123",
        status: "SUCCESS"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(paymentService.handleCallback).toHaveBeenCalledTimes(1);
  });
});
