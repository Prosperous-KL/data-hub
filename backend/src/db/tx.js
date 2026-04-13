const pool = require("./pool");

const MAX_TRANSACTION_RETRIES = 3;

function isRetryableTransactionError(error) {
  const code = String(error?.code || "");
  // 40001: serialization_failure, 40P01: deadlock_detected
  return code === "40001" || code === "40P01";
}

async function withTransaction(handler) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

      const result = await handler(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_rollbackError) {
        // no-op: original error is more useful to bubble up
      }

      if (isRetryableTransactionError(error) && attempt < MAX_TRANSACTION_RETRIES) {
        continue;
      }

      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = {
  withTransaction
};
