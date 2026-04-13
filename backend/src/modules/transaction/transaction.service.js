const pool = require("../../db/pool");

function shouldUseMemoryFallback(error) {
  if (!error) {
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

async function getUserTransactions(userId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT id, type, amount, status, reference, narration, category, metadata, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return [];
    }

    throw error;
  }
}

module.exports = {
  getUserTransactions
};
