const ApiError = require("./apiError");
const env = require("../config/env");

/**
 * Determines whether an error is a transient DB-connectivity issue
 * and the caller may fall back to in-memory storage.
 *
 * In production, memory fallbacks are DISABLED — losing persistence
 * for financial data is far worse than returning 503.
 */
function shouldUseMemoryFallback(error) {
  if (!error || error instanceof ApiError) {
    return false;
  }

  // Never use memory fallbacks in production — data loss is unacceptable
  if (env.NODE_ENV === "production") {
    return false;
  }

  const code = String(error.code || "").toUpperCase();
  const message = String(error.message || "").toLowerCase();

  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    message.includes("connect") ||
    message.includes("database") ||
    message.includes("timeout")
  );
}

module.exports = { shouldUseMemoryFallback };
