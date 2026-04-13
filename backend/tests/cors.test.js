process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123";
process.env.PAYMENT_PROVIDER = "SIMULATED";
process.env.PAYMENT_CALLBACK_TOKEN = "callback_secret_token";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";
process.env.CORS_ORIGIN = "http://localhost:3000,https://*.vercel.app,https://app.example.com";

const request = require("supertest");
const app = require("../src/app");

describe("CORS policy", () => {
  it("allows configured origins", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("allows wildcard origins", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://my-frontend.vercel.app");

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("https://my-frontend.vercel.app");
  });

  it("does not allow unconfigured origins", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://evil.example.com");

    expect(response.statusCode).toBe(403);
    expect(response.body.code).toBe("CORS_ERROR");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
