const { v4: uuidv4 } = require("uuid");
const pool = require("../../db/pool");
const ApiError = require("../../utils/apiError");
const walletService = require("../wallet/wallet.service");
const authService = require("../auth/auth.service");

function shouldUseMemoryFallback(error) {
  if (!error || error instanceof ApiError) {
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

async function listUsers(limit = 100) {
  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.role,
         u.created_at,
         COALESCE(w.available_balance, 0) AS wallet_balance,
         COALESCE(tx.transaction_count, 0) AS transaction_count,
         COALESCE(tx.last_transaction_at, u.created_at) AS last_transaction_at
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       LEFT JOIN (
         SELECT user_id, COUNT(*)::int AS transaction_count, MAX(created_at) AS last_transaction_at
         FROM transactions
         GROUP BY user_id
       ) tx ON tx.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return authService.getRegisteredUsersInMemory().map((user) => ({
        ...user,
        wallet_balance: 0,
        transaction_count: 0,
        last_transaction_at: user.created_at
      }));
    }

    throw error;
  }
}

async function listTransactions(limit = 200) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, type, amount, status, reference, narration, category, metadata, created_at
       FROM transactions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return [];
    }

    throw error;
  }
}

async function listFailedTransactions(limit = 200) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, type, amount, status, reference, narration, category, metadata, created_at
       FROM transactions
       WHERE status = 'failed' OR category = 'refund'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return [];
    }

    throw error;
  }
}

async function manualRefund({ transactionId, reason, adminUserId }) {
  try {
    const txResult = await pool.query(
      `SELECT id, user_id, amount, type, status
       FROM transactions
       WHERE id = $1`,
      [transactionId]
    );

    if (txResult.rows.length === 0) {
      throw new ApiError(404, "Original transaction not found", "TRANSACTION_NOT_FOUND");
    }

    const original = txResult.rows[0];

    if (original.type !== "debit" || original.status !== "success") {
      throw new ApiError(400, "Only successful debit transactions can be refunded", "INVALID_REFUND_TARGET");
    }

    const existingRefund = await pool.query(
      `SELECT id
       FROM transactions
       WHERE category = 'manual_refund'
       AND metadata->>'originalTransactionId' = $1`,
      [transactionId]
    );

    if (existingRefund.rows.length > 0) {
      throw new ApiError(409, "Refund already exists for this transaction", "REFUND_EXISTS");
    }

    const refundRef = `MREF-${uuidv4()}`;

    const refund = await walletService.creditWallet({
      userId: original.user_id,
      amount: original.amount,
      reference: refundRef,
      narration: `Manual refund: ${reason}`,
      category: "manual_refund",
      idempotencyKey: `manual-refund-${transactionId}`,
      metadata: {
        originalTransactionId: transactionId,
        refundedBy: adminUserId,
        reason
      }
    });

    return refund;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (shouldUseMemoryFallback(error)) {
      throw new ApiError(503, "Service temporarily unavailable. Database connection failed.", "SERVICE_UNAVAILABLE");
    }

    throw error;
  }
}

module.exports = {
  listUsers,
  listTransactions,
  listFailedTransactions,
  manualRefund
};
