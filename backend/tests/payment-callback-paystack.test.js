process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123";
process.env.PAYMENT_PROVIDER = "SIMULATED";
process.env.PAYMENT_CALLBACK_TOKEN = "callback_secret_token";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";
process.env.PAYMENT_CALLBACK_PROVIDER = "PAYSTACK";
process.env.PAYSTACK_SECRET_KEY = "sk_test_paystack_secret";

const request = require("supertest");
const { createHmac } = require("crypto");
const app = require("../src/app");
const paymentService = require("../src/modules/payment/payment.service");

jest.mock("../src/modules/payment/payment.service", () => ({
  handleCallback: jest.fn()
}));

describe("Paystack callback security", () => {
  it("rejects callback with invalid Paystack signature", async () => {
    const response = await request(app).post("/api/payment/callback").send({
      event: "charge.success",
      data: {
        reference: "PAY-123",
        status: "success"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.code).toBe("INVALID_CALLBACK_SIGNATURE");
  });

  it("accepts valid Paystack callback signature and processes payment", async () => {
    paymentService.handleCallback.mockResolvedValue({
      alreadyProcessed: false,
      payment: { id: "pay-1", status: "success" }
    });

    const payload = {
      event: "charge.success",
      data: {
        id: 9001,
        reference: "PAY-123",
        status: "success"
      }
    };

    const rawBody = JSON.stringify(payload);
    const signature = createHmac("sha512", "sk_test_paystack_secret").update(rawBody).digest("hex");

    const response = await request(app)
      .post("/api/payment/callback")
      .set("x-paystack-signature", signature)
      .send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(paymentService.handleCallback).toHaveBeenCalledWith({
      externalReference: "PAY-123",
      status: "SUCCESS",
      providerReference: "9001",
      reason: undefined
    });
  });
});
