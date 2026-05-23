const pool = require("../../db/pool");
const { shouldUseMemoryFallback } = require("../../utils/memoryFallback");

async function getUserTransactions(userId, limit = 50, page = 1) {
  const offset = (page - 1) * limit;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM transactions WHERE user_id = $1`,
      [userId]
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT id, type, amount, status, reference, narration, category, metadata, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return { data: [], total: 0, page: 1, totalPages: 1 };
    }

    throw error;
  }
}

module.exports = {
  getUserTransactions
};
