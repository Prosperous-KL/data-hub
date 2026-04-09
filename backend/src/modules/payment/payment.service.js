const { v4: uuidv4 } = require("uuid");
const pool = require("../../db/pool");
const { withTransaction } = require("../../db/tx");
const ApiError = require("../../utils/apiError");
const { initiateMomoCharge } = require("./payment.provider");

async function initiatePayment({ userId, amount, momoNumber, provider, idempotencyKey }) {
  const externalReference = `PAY-${uuidv4()}`;

  const providerResponse = await initiateMomoCharge({
    amount,
    momoNumber,
    provider,
    externalReference
  });

  const paymentResult = await withTransaction(async (client) => {
    const walletResult = await client.query("SELECT id FROM wallets WHERE user_id = $1", [userId]);
    if (walletResult.rows.length === 0) {
      throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
    }

    const paymentInsert = await client.query(
      `INSERT INTO payments
      (user_id, wallet_id, amount, provider, momo_number, status, external_reference, provider_reference, idempotency_key)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
      RETURNING *`,
      [
        userId,
        walletResult.rows[0].id,
        amount,
        provider,
        momoNumber,
        externalReference,
        providerResponse.providerReference,
        idempotencyKey
      ]
    );

    return paymentInsert.rows[0];
  });

  return {
    payment: paymentResult,
    checkoutUrl: providerResponse.checkoutUrl,
    approvalMessage: "Approve the MoMo prompt on your phone to complete funding"
  };
}

async function handleCallback({ externalReference, status, providerReference, reason }) {
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT *
       FROM payments
       WHERE external_reference = $1
       FOR UPDATE`,
      [externalReference]
    );

    if (paymentResult.rows.length === 0) {
      throw new ApiError(404, "Payment reference not found", "PAYMENT_NOT_FOUND");
    }

    const payment = paymentResult.rows[0];

    if (payment.status === "success") {
      return {
        alreadyProcessed: true,
        payment
      };
    }

    if (status === "FAILED") {
      const failed = await client.query(
        `UPDATE payments
         SET status = 'failed', reason = $1, provider_reference = COALESCE($2, provider_reference), updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [reason || "Provider rejected payment", providerReference || null, payment.id]
      );

      return {
        alreadyProcessed: false,
        payment: failed.rows[0]
      };
    }

    const walletLock = await client.query(
      `SELECT id, available_balance
       FROM wallets
       WHERE id = $1
       FOR UPDATE`,
      [payment.wallet_id]
    );

    const wallet = walletLock.rows[0];
    const beforeBalance = Number(wallet.available_balance);
    const afterBalance = beforeBalance + Number(payment.amount);

    const txResult = await client.query(
      `INSERT INTO transactions
      (user_id, wallet_id, type, amount, status, reference, narration, category, idempotency_key, metadata)
      VALUES ($1, $2, 'credit', $3, 'success', $4, $5, 'wallet_funding', $6, $7)
      RETURNING *`,
      [
        payment.user_id,
        payment.wallet_id,
        payment.amount,
        externalReference,
        "Wallet funded through MoMo",
        `fund-${externalReference}`,
        { paymentId: payment.id }
      ]
    );

    await client.query(
      `INSERT INTO ledger (transaction_id, wallet_id, entry_type, amount, balance_before, balance_after, description)
       VALUES ($1, $2, 'debit', $3, $4, $5, $6),
              ($1, $2, 'credit', $3, $4, $5, $7)`,
      [
        txResult.rows[0].id,
        payment.wallet_id,
        payment.amount,
        beforeBalance,
        afterBalance,
        "Mobile Money clearing account",
        "Wallet funding settled"
      ]
    );

    await client.query(
      `UPDATE wallets SET available_balance = $1, updated_at = NOW() WHERE id = $2`,
      [afterBalance, payment.wallet_id]
    );

    const successPayment = await client.query(
      `UPDATE payments
       SET status = 'success', provider_reference = COALESCE($1, provider_reference), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [providerReference || null, payment.id]
    );

    return {
      alreadyProcessed: false,
      payment: successPayment.rows[0]
    };
  });
}

module.exports = {
  initiatePayment,
  handleCallback
};
