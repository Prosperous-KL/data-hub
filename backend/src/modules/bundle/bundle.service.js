const pool = require("../../db/pool");
const { withTransaction } = require("../../db/tx");
const ApiError = require("../../utils/apiError");
const { DATA_BUNDLES } = require("../../utils/constants");

async function getUserBundlePricing(userId, network) {
  const result = await pool.query(
    `SELECT bundle_code, base_price, custom_profit, selling_price
     FROM bundle_pricing
     WHERE user_id = $1 AND network = $2
     ORDER BY bundle_code`,
    [userId, network]
  );
  
  return result.rows;
}

async function setBundlePricing(userId, network, bundlePricingUpdates) {
  const bundles = DATA_BUNDLES[network];
  if (!bundles) {
    throw new ApiError(400, "Invalid network", "INVALID_NETWORK");
  }

  return await withTransaction(async (client) => {
    const updated = [];
    
    for (const update of bundlePricingUpdates) {
      const { bundleCode, profit } = update;
      
      const bundle = bundles.find(b => b.code === bundleCode);
      if (!bundle) {
        throw new ApiError(400, `Invalid bundle code for ${network}: ${bundleCode}`, "INVALID_BUNDLE");
      }
      
      if (profit === undefined || profit === null || profit < 0) {
        throw new ApiError(400, "Profit must be a non-negative number", "INVALID_PROFIT");
      }

      const sellingPrice = bundle.basePrice + profit;
      
      const result = await client.query(
        `INSERT INTO bundle_pricing (user_id, bundle_code, network, base_price, custom_profit, selling_price)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, bundle_code) DO UPDATE SET
           custom_profit = $5,
           selling_price = $6,
           updated_at = NOW()
         RETURNING bundle_code, base_price, custom_profit, selling_price`,
        [userId, bundleCode, network, bundle.basePrice, profit, sellingPrice]
      );
      
      updated.push(result.rows[0]);
    }
    
    return updated;
  });
}

async function getEffectivePrice(userId, bundleCode, network) {
  try {
    const result = await pool.query(
      `SELECT selling_price FROM bundle_pricing
       WHERE user_id = $1 AND bundle_code = $2 AND network = $3`,
      [userId, bundleCode, network]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].selling_price;
    }
  } catch (_error) {
    // Fall through to default
  }
  
  const bundles = DATA_BUNDLES[network] || [];
  const bundle = bundles.find(b => b.code === bundleCode);
  return bundle ? bundle.amount : null;
}

async function resetToDefaults(userId, network) {
  const result = await pool.query(
    `DELETE FROM bundle_pricing
     WHERE user_id = $1 AND network = $2`,
    [userId, network]
  );
  
  return result.rowCount;
}

module.exports = {
  getUserBundlePricing,
  setBundlePricing,
  getEffectivePrice,
  resetToDefaults
};
