process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/prosperous_data_hub";
process.env.JWT_SECRET = "test_secret_test_secret_123_test_secret";
process.env.JWT_EXPIRES_IN = "7d";
process.env.ADMIN_EMAIL = "admin@prosperoushub.com";

const jwt = require("jsonwebtoken");

jest.mock("bcrypt", () => ({
  compare: jest.fn(async () => true)
}));

jest.mock("../src/db/pool", () => {
  const mockRows = [];
  return {
    query: jest.fn(async (sql, params) => {
      if (sql.includes("SELECT token FROM jwt_blacklist")) {
        const token = params[0];
        const isBlacklisted = mockRows.some(row => row.token === token);
        return { rows: isBlacklisted ? [{ token }] : [] };
      }
      if (sql.includes("INSERT INTO jwt_blacklist")) {
        const token1 = params[0];
        const token2 = params[2];
        mockRows.push({ token: token1 });
        mockRows.push({ token: token2 });
        return { rowCount: 2 };
      }
      if (sql.includes("FROM users")) {
        return {
          rows: [{
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "test@example.com",
            phone: "0240000000",
            full_name: "Test User",
            password_hash: "hashed",
            role: "user",
            is_active: true
          }]
        };
      }
      return { rows: [] };
    }),
    _clearBlacklist: () => {
      mockRows.length = 0;
    }
  };
});

const pool = require("../src/db/pool");
const authService = require("../src/modules/auth/auth.service");

describe("Auth JWT Refresh & Blacklist flow", () => {
  beforeEach(() => {
    pool.query.mockClear();
    pool._clearBlacklist();
  });

  it("generates an access token and a refresh token pair", async () => {
    const result = await authService.login({
      email: "test@example.com",
      password: "password123"
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const accessPayload = jwt.verify(result.accessToken, process.env.JWT_SECRET);
    const refreshPayload = jwt.verify(result.refreshToken, process.env.JWT_SECRET);

    expect(accessPayload.sub).toBe(result.user.id);
    expect(refreshPayload.sub).toBe(result.user.id);
    expect(refreshPayload.type).toBe("refresh");
  });

  it("successfully refreshes a valid refresh token", async () => {
    const result = await authService.login({
      email: "test@example.com",
      password: "password123"
    });

    const tokens = await authService.refreshToken(result.refreshToken);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it("rejects refresh if the token is blacklisted", async () => {
    const result = await authService.login({
      email: "test@example.com",
      password: "password123"
    });

    // Logout to blacklist the tokens
    await authService.logout(result.accessToken, result.refreshToken);

    // Refresh should now fail
    await expect(authService.refreshToken(result.refreshToken)).rejects.toThrow(
      "Token has been revoked"
    );
  });
});
