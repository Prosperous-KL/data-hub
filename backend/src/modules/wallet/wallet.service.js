const pool = require("../../db/pool");
const { withTransaction } = require("../../db/tx");
const ApiError = require("../../utils/apiError");

async function getWalletByUserId(userId) {
  const result = await pool.query(
    `SELECT id, user_id, available_balance, locked_balance, updated_at
     FROM wallets
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
  }

  return result.rows[0];
}

async function creditWallet({ userId, amount, reference, narration, category, idempotencyKey, metadata = {} }) {
  try {
    return await withTransaction(async (client) => {
      const walletResult = await client.query(
        `SELECT id, available_balance
         FROM wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
      }

      const wallet = walletResult.rows[0];
      const beforeBalance = Number(wallet.available_balance);
      const afterBalance = beforeBalance + Number(amount);

      const txResult = await client.query(
        `INSERT INTO transactions
        (user_id, wallet_id, type, amount, status, reference, narration, category, idempotency_key, metadata)
        VALUES ($1, $2, 'credit', $3, 'success', $4, $5, $6, $7, $8)
        RETURNING *`,
        [userId, wallet.id, amount, reference, narration, category, idempotencyKey, metadata]
      );

      const tx = txResult.rows[0];

      await client.query(
        `INSERT INTO ledger (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after, description)
         VALUES ($1, $2, 'debit', $3, $4, $5, $6),
                ($1, $2, 'credit', $3, $4, $5, $7)`,
        [tx.id, wallet.id, amount, beforeBalance, afterBalance, "System funding source", narration]
      );

      await client.query(
        `UPDATE wallets
         SET available_balance = $1, updated_at = NOW()
         WHERE id = $2`,
        [afterBalance, wallet.id]
      );

      return {
        transaction: tx,
        balance: afterBalance
      };
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "Duplicate idempotency key", "DUPLICATE_TRANSACTION");
    }
    throw error;
  }
}

async function debitWallet({ userId, amount, reference, narration, category, idempotencyKey, metadata = {} }) {
  try {
    return await withTransaction(async (client) => {
      const walletResult = await client.query(
        `SELECT id, available_balance
         FROM wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [userId]
      );

      if (walletResult.rows.length === 0) {
        throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
      }

      const wallet = walletResult.rows[0];
      const beforeBalance = Number(wallet.available_balance);

      if (beforeBalance < Number(amount)) {
        throw new ApiError(400, "Insufficient wallet balance", "INSUFFICIENT_BALANCE");
      }

      const afterBalance = beforeBalance - Number(amount);

      const txResult = await client.query(
        `INSERT INTO transactions
        (user_id, wallet_id, type, amount, status, reference, narration, category, idempotency_key, metadata)
        VALUES ($1, $2, 'debit', $3, 'success', $4, $5, $6, $7, $8)
        RETURNING *`,
        [userId, wallet.id, amount, reference, narration, category, idempotencyKey, metadata]
      );

      const tx = txResult.rows[0];

      await client.query(
        `INSERT INTO ledger (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after, description)
         VALUES ($1, $2, 'debit', $3, $4, $5, $6),
                ($1, $2, 'credit', $3, $4, $5, $7)`,
        [tx.id, wallet.id, amount, beforeBalance, afterBalance, narration, "VTU settlement account"]
      );

      await client.query(
        `UPDATE wallets
         SET available_balance = $1, updated_at = NOW()
         WHERE id = $2`,
        [afterBalance, wallet.id]
      );

      return {
        transaction: tx,
        balance: afterBalance
      };
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "Duplicate idempotency key", "DUPLICATE_TRANSACTION");
    }
    throw error;
  }
}

module.exports = {
  getWalletByUserId,
  creditWallet,
  debitWallet
};
