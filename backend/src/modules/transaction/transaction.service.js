const pool = require("../../db/pool");

async function getUserTransactions(userId, limit = 50) {
  const result = await pool.query(
    `SELECT id, type, amount, status, reference, narration, category, metadata, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

module.exports = {
  getUserTransactions
};
