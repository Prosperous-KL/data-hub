const { v4: uuidv4 } = require("uuid");
const pool = require("../../db/pool");
const { withTransaction } = require("../../db/tx");
const ApiError = require("../../utils/apiError");
const walletService = require("../wallet/wallet.service");
const paymentService = require("../payment/payment.service");
const bundleService = require("../bundle/bundle.service");
const { DATA_BUNDLES } = require("../../utils/constants");
const { sendDataBundle } = require("./vtu.provider");

const memoryPurchases = [];

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

function getBundle(network, bundleCode) {
  const bundle = (DATA_BUNDLES[network] || []).find((item) => item.code === bundleCode);
  if (!bundle) {
    throw new ApiError(400, "Invalid bundle for selected network", "INVALID_BUNDLE");
  }
  return bundle;
}

async function buyData({ userId, network, bundleCode, phoneNumber, momoNumber, idempotencyKey }) {
  const bundle = getBundle(network, bundleCode);
  
  // Get effective price (custom or default)
  const effectivePrice = await bundleService.getEffectivePrice(userId, bundleCode, network);
  const chargeAmount = Number(effectivePrice);

  const wallet = await walletService.getWalletByUserId(userId);
  const availableBalance = Number(wallet.available_balance || 0);

  if (availableBalance < chargeAmount) {
    const payment = await paymentService.initiatePayment({
      userId,
      amount: chargeAmount,
      momoNumber,
      provider: network,
      idempotencyKey: `${idempotencyKey}-fund`
    });

    return {
      status: "pending_payment",
      message: "Payment prompt initiated. Approve on your phone to continue.",
      approvalMessage: payment.approvalMessage,
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.payment.id,
      requiredAmount: chargeAmount,
      currentBalance: availableBalance
    };
  }

  const reference = `VTU-${uuidv4()}`;

  const debit = await walletService.debitWallet({
    userId,
    amount: chargeAmount,
    reference,
    narration: `Data bundle purchase ${bundle.volume} ${network}`,
    category: "data_purchase",
    idempotencyKey,
    metadata: { network, bundleCode, phoneNumber, momoNumber }
  });

  let purchase;
  try {
    purchase = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `INSERT INTO data_purchases
        (user_id, transaction_id, network, bundle_code, volume, amount, phone_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *`,
        [userId, debit.transaction.id, network, bundleCode, bundle.volume, chargeAmount, phoneNumber]
      );

      return insertResult.rows[0];
    });
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    purchase = {
      id: `mem-purchase-${Date.now()}`,
      user_id: userId,
      transaction_id: debit.transaction.id,
      network,
      bundle_code: bundleCode,
      volume: bundle.volume,
      amount: chargeAmount,
      phone_number: phoneNumber,
      momo_number: momoNumber,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryPurchases.push(purchase);
  }

  const providerResult = await sendDataBundle({
    network,
    bundleCode,
    phoneNumber
  });

  if (providerResult.success) {
    try {
      await pool.query(
        `UPDATE data_purchases
         SET status = 'delivered', provider_reference = $1, delivered_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [providerResult.providerReference, purchase.id]
      );
    } catch (error) {
      if (!shouldUseMemoryFallback(error)) {
        throw error;
      }

      purchase.status = "delivered";
      purchase.provider_reference = providerResult.providerReference;
      purchase.delivered_at = new Date().toISOString();
      purchase.updated_at = new Date().toISOString();
    }

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
    metadata: { originalTransactionId: debit.transaction.id, reason: providerResult.message, momoNumber }
  });

  try {
    await pool.query(
      `UPDATE data_purchases
       SET status = 'failed_refunded', provider_reference = $1, failure_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [providerResult.providerReference, providerResult.message, purchase.id]
    );
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    purchase.status = "failed_refunded";
    purchase.provider_reference = providerResult.providerReference;
    purchase.failure_reason = providerResult.message;
    purchase.updated_at = new Date().toISOString();
  }

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
