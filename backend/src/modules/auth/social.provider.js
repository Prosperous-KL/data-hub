const axios = require("axios");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  return String(value || "").toLowerCase() === "true";
}

async function verifyGoogleIdToken(idToken) {
  const token = String(idToken || "").trim();
  if (!token) {
    throw new ApiError(400, "Google ID token is required", "GOOGLE_ID_TOKEN_REQUIRED");
  }

  try {
    const response = await axios.get(env.GOOGLE_TOKENINFO_URL, {
      params: { id_token: token },
      timeout: 10000,
      validateStatus: () => true
    });

    const data = response.data || {};

    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(401, data.error_description || "Invalid Google token", "GOOGLE_TOKEN_INVALID");
    }

    const email = String(data.email || "").toLowerCase().trim();
    const sub = String(data.sub || "").trim();
    const aud = String(data.aud || "").trim();
    const emailVerified = parseBoolean(data.email_verified);

    if (!email || !sub) {
      throw new ApiError(401, "Google token payload is missing required user fields", "GOOGLE_TOKEN_INVALID_PAYLOAD");
    }

    if (!emailVerified) {
      throw new ApiError(401, "Google account email is not verified", "GOOGLE_EMAIL_NOT_VERIFIED");
    }

    if (env.GOOGLE_CLIENT_ID && aud !== env.GOOGLE_CLIENT_ID) {
      throw new ApiError(401, "Google token audience mismatch", "GOOGLE_AUDIENCE_MISMATCH");
    }

    return {
      provider: "GOOGLE",
      providerUserId: sub,
      email,
      name: String(data.name || "").trim() || null,
      picture: String(data.picture || "").trim() || null,
      audience: aud
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, "Failed to verify Google token", "GOOGLE_PROVIDER_ERROR");
  }
}

module.exports = {
  verifyGoogleIdToken
};
