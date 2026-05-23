const jwt = require("jsonwebtoken");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

const pool = require("../db/pool");
const { shouldUseMemoryFallback } = require("../utils/memoryFallback");
const { memoryTokenBlacklist } = require("../utils/mockDb");

async function authRequired(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Missing access token", "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.type === "refresh") {
      return next(new ApiError(401, "Invalid token type", "UNAUTHORIZED"));
    }

    // Check blacklist
    try {
      const checkRes = await pool.query(
        `SELECT token FROM jwt_blacklist WHERE token = $1`,
        [token]
      );
      if (checkRes.rows.length > 0) {
        return next(new ApiError(401, "Token has been revoked", "UNAUTHORIZED"));
      }
    } catch (dbErr) {
      if (shouldUseMemoryFallback(dbErr)) {
        if (memoryTokenBlacklist.includes(token)) {
          return next(new ApiError(401, "Token has been revoked", "UNAUTHORIZED"));
        }
      } else {
        return next(dbErr);
      }
    }

    req.user = payload;
    req.token = token;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden", "FORBIDDEN"));
    }
    return next();
  };
}

module.exports = {
  authRequired,
  requireRole
};
