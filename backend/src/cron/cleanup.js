const pool = require("../db/pool");
const env = require("../config/env");
const logger = require("../utils/logger");

const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour

function startCleanupJobs() {
  if (env.NODE_ENV === "test") return;

  setInterval(async () => {
    try {
      // Delete OTPs older than 1 day
      const otpRes = await pool.query(`
        DELETE FROM otp_codes 
        WHERE created_at < NOW() - INTERVAL '1 day'
      `);
      
      // Delete idempotency keys older than 7 days
      const idempRes = await pool.query(`
        DELETE FROM idempotency_keys 
        WHERE created_at < NOW() - INTERVAL '7 days'
      `);

      // Delete expired blacklisted tokens
      const blacklistRes = await pool.query(`
        DELETE FROM jwt_blacklist
        WHERE expires_at < NOW()
      `);

      logger.info("Background cleanup job completed", {
        deletedOtps: otpRes.rowCount,
        deletedIdempotencyKeys: idempRes.rowCount,
        deletedBlacklistedTokens: blacklistRes.rowCount
      });
    } catch (error) {
      logger.error("Background cleanup job failed", { error });
    }
  }, CLEANUP_INTERVAL).unref();
}

module.exports = { startCleanupJobs };
