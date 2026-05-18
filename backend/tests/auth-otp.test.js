process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123";
process.env.PAYMENT_PROVIDER = "SIMULATED";
process.env.PAYMENT_CALLBACK_TOKEN = "callback_secret_token";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";

jest.mock("../src/db/pool.js", () => ({
  default: {
    query: jest.fn(async () => ({ rows: [] }))
  }
}));

jest.mock("../src/db/tx.js", () => ({
  default: {
    withTransaction: jest.fn(async (callback) => callback({ query: jest.fn(async () => ({ rows: [] })) }))
  }
}));

jest.mock("../src/modules/auth/otpDelivery.js", () => ({
  __esModule: true,
  sendAuthOtp: jest.fn(async ({ channel }) => ({
    deliveryMethod: channel === "EMAIL" ? "Gmail" : "SMS"
  }))
}));

import pool from "../src/db/pool.js";
import { passwordResetSchema } from "../src/modules/auth/auth.validation.js";
import { sendAuthOtp } from "../src/modules/auth/otpDelivery.js";
import authService from "../src/modules/auth/auth.service.js";

describe("Auth OTP flow", () => {
  beforeEach(() => {
    pool.query.mockClear();
    sendAuthOtp.mockClear();
  });

  it("generates a 6-digit OTP and brands the delivery message", async () => {
    const response = await authService.requestPasswordRecoveryOtp({
      identifier: "user@example.com",
      channel: "EMAIL"
    });

    expect(response.devOtp).toMatch(/^\d{6}$/);
    expect(response.deliveryMethod).toBe("Gmail");
    expect(response.message).toBe("Prosperous Data Hub Confirmation sent via Gmail");
    expect(pool.query).toHaveBeenCalled();
    expect(sendAuthOtp).toHaveBeenCalledTimes(1);
  });

  it("accepts the 6-digit code in validation", () => {
    const result = passwordResetSchema.safeParse({
      body: {
        identifier: "user@example.com",
        otpSessionId: "550e8400-e29b-41d4-a716-446655440000",
        otpCode: "123456",
        newPassword: "Password123!"
      }
    });

    expect(result.success).toBe(true);
  });
});