const { v4: uuidv4 } = require("uuid");
const pool = require("../../db/pool");
const { withTransaction } = require("../../db/tx");
const ApiError = require("../../utils/apiError");
const walletService = require("../wallet/wallet.service");
const { DATA_BUNDLES } = require("../../utils/constants");
const { sendDataBundle } = require("./vtu.provider");

function getBundle(network, bundleCode) {
  const bundle = (DATA_BUNDLES[network] || []).find((item) => item.code === bundleCode);
  if (!bundle) {
    throw new ApiError(400, "Invalid bundle for selected network", "INVALID_BUNDLE");
  }
  return bundle;
}

async function buyData({ userId, network, bundleCode, phoneNumber, idempotencyKey }) {
  const bundle = getBundle(network, bundleCode);
  const reference = `VTU-${uuidv4()}`;

  const debit = await walletService.debitWallet({
    userId,
    amount: bundle.amount,
    reference,
    narration: `Data bundle purchase ${bundle.volume} ${network}`,
    category: "data_purchase",
    idempotencyKey,
    metadata: { network, bundleCode, phoneNumber }
  });

  const purchase = await withTransaction(async (client) => {
    const insertResult = await client.query(
      `INSERT INTO data_purchases
      (user_id, transaction_id, network, bundle_code, volume, amount, phone_number, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [userId, debit.transaction.id, network, bundleCode, bundle.volume, bundle.amount, phoneNumber]
    );

    return insertResult.rows[0];
  });

  const providerResult = await sendDataBundle({
    network,
    bundleCode,
    phoneNumber
  });

  if (providerResult.success) {
    await pool.query(
      `UPDATE data_purchases
       SET status = 'delivered', provider_reference = $1, delivered_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [providerResult.providerReference, purchase.id]
    );

    return {
      status: "delivered",
      message: "Data bundle delivered successfully",
      purchaseId: purchase.id,
      transactionId: debit.transaction.id,
      balance: debit.balance,
      providerReference: providerResult.providerReference
    };
  }

  const refundReference = `REFUND-${reference}`;

  await walletService.creditWallet({
    userId,
    amount: bundle.amount,
    reference: refundReference,
    narration: `Refund for failed data purchase ${bundle.volume} ${network}`,
    category: "refund",
    idempotencyKey: `${idempotencyKey}-refund`,
    metadata: { originalTransactionId: debit.transaction.id, reason: providerResult.message }
  });

  await pool.query(
    `UPDATE data_purchases
     SET status = 'failed_refunded', provider_reference = $1, failure_reason = $2, updated_at = NOW()
     WHERE id = $3`,
    [providerResult.providerReference, providerResult.message, purchase.id]
  );

  return {
    status: "failed_refunded",
    message: "Data provider failed. Wallet has been refunded.",
    purchaseId: purchase.id,
    transactionId: debit.transaction.id,
    balance: debit.balance
  };
}

module.exports = {
  buyData
};
