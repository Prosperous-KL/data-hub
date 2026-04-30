const pool = require("../../db/pool");
const ApiError = require("../../utils/apiError");

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

const memoryProducts = [];
const memoryOrders = [];
const memoryWithdrawals = [];
let memorySettings = {
  shop_name: "Prosperous Data Hub",
  open: true,
  closed_notice: "",
  support_contact: "",
  community_link: ""
};

async function listProducts(limit = 100) {
  try {
    const result = await pool.query(
      `SELECT id, seller_id, title, description, price_cents, currency, stock, created_at
       FROM store_products
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) return memoryProducts;
    throw error;
  }
}

async function createProduct({ sellerId, title, description, priceCents, currency = "GHS", stock = 0 }) {
  try {
    const result = await pool.query(
      `INSERT INTO store_products (seller_id, title, description, price_cents, currency, stock)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, seller_id, title, description, price_cents, currency, stock, created_at`,
      [sellerId, title, description, priceCents, currency, stock]
    );
    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const id = `mem-prod-${Date.now()}`;
      const prod = { id, seller_id: sellerId, title, description, price_cents: priceCents, currency, stock, created_at: new Date().toISOString() };
      memoryProducts.unshift(prod);
      return prod;
    }
    throw error;
  }
}

async function updateProduct({ sellerId, productId, title, description, priceCents, currency = "GHS", stock = 0 }) {
  try {
    const result = await pool.query(
      `UPDATE store_products
       SET title = $1, description = $2, price_cents = $3, currency = $4, stock = $5, updated_at = NOW()
       WHERE id = $6 AND seller_id = $7
       RETURNING id, seller_id, title, description, price_cents, currency, stock, created_at`,
      [title, description, priceCents, currency, stock, productId, sellerId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const item = memoryProducts.find((product) => product.id === productId && product.seller_id === sellerId);

      if (!item) {
        throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
      }

      item.title = title;
      item.description = description;
      item.price_cents = priceCents;
      item.currency = currency;
      item.stock = stock;
      return item;
    }

    throw error;
  }
}

async function listOrders({ sellerId, q, status, network, limit = 100 }) {
  try {
    const clauses = ["seller_id = $1"];
    const params = [sellerId];

    if (q) {
      params.push(`%${q}%`);
      clauses.push(`(phone ILIKE $${params.length} OR order_ref ILIKE $${params.length})`);
    }

    if (status && status !== "ALL") {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }

    if (network && network !== "ALL") {
      params.push(network);
      clauses.push(`network = $${params.length}`);
    }

    params.push(limit);

    const result = await pool.query(
      `SELECT id, seller_id, order_ref, phone, product, paid_cents, profit_cents, network, status, created_at
       FROM store_orders
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return memoryOrders
        .filter((order) => order.seller_id === sellerId)
        .filter((order) => (q ? String(order.phone).includes(q) || String(order.id).includes(q) : true))
        .filter((order) => (status && status !== "ALL" ? order.status === status : true))
        .filter((order) => (network && network !== "ALL" ? order.network === network : true))
        .slice(0, limit);
    }

    throw error;
  }
}

async function createOrder({ sellerId, phone, product, paidCents, profitCents = 0, network, status = "PAID" }) {
  const orderRef = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await pool.query(
      `WITH inserted_order AS (
         INSERT INTO store_orders (seller_id, order_ref, phone, product, paid_cents, profit_cents, network, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, seller_id, order_ref, phone, product, paid_cents, profit_cents, network, status, created_at
       ),
       stock_update AS (
         UPDATE store_products
         SET stock = GREATEST(stock - 1, 0), updated_at = NOW()
         WHERE seller_id = $1 AND title = $4
         RETURNING id
       )
       SELECT * FROM inserted_order`,
      [sellerId, orderRef, phone, product, paidCents, profitCents, network, status]
    );

    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const record = {
        id: orderRef,
        seller_id: sellerId,
        order_ref: orderRef,
        phone,
        product,
        paid_cents: paidCents,
        profit_cents: profitCents,
        network,
        status,
        created_at: new Date().toISOString()
      };
      memoryOrders.unshift(record);
      return record;
    }

    throw error;
  }
}

async function addMockOrder({ sellerId, phone, productTitle, amountCents = 1000, profitCents = 200, network = "MTN", status = "PAID" }) {
  const orderRef = `ORD-${Date.now()}${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await pool.query(
      `INSERT INTO store_orders (seller_id, order_ref, phone, product, paid_cents, profit_cents, network, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, seller_id, order_ref, phone, product, paid_cents, profit_cents, network, status, created_at`,
      [sellerId, orderRef, phone, productTitle, amountCents, profitCents, network, status]
    );

    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const rec = {
        id: orderRef,
        seller_id: sellerId,
        order_ref: orderRef,
        phone,
        product: productTitle,
        paid_cents: amountCents,
        profit_cents: profitCents,
        network,
        status,
        created_at: new Date().toISOString()
      };
      memoryOrders.unshift(rec);
      return rec;
    }

    throw error;
  }
}

async function requestWithdrawal({ sellerId, amountCents, network, momoNumber }) {
  try {
    const result = await pool.query(
      `INSERT INTO store_withdrawals (seller_id, amount_cents, network, momo_number, status)
       VALUES ($1,$2,$3,$4,'PENDING')
       RETURNING id, seller_id, amount_cents, network, momo_number, status, created_at`,
      [sellerId, amountCents, network, momoNumber]
    );

    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      const rec = {
        id: `WDL-${Date.now()}${Math.floor(Math.random() * 1000)}`,
        seller_id: sellerId,
        amount_cents: amountCents,
        network,
        momo_number: momoNumber,
        status: "PENDING",
        created_at: new Date().toISOString()
      };
      memoryWithdrawals.unshift(rec);
      return rec;
    }

    throw error;
  }
}

async function listWithdrawals({ sellerId, limit = 100 }) {
  try {
    const result = await pool.query(
      `SELECT id, seller_id, amount_cents, network, momo_number, status, created_at
       FROM store_withdrawals
       WHERE seller_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [sellerId, limit]
    );

    return result.rows;
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return memoryWithdrawals.filter((withdrawal) => withdrawal.seller_id === sellerId).slice(0, limit);
    }

    throw error;
  }
}

async function getSellerSettings(sellerId) {
  try {
    const result = await pool.query(
      `INSERT INTO store_settings (seller_id)
       VALUES ($1)
       ON CONFLICT (seller_id) DO NOTHING
       RETURNING seller_id, shop_name, open, closed_notice, support_contact, community_link, created_at, updated_at`,
      [sellerId]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    const selected = await pool.query(
      `SELECT seller_id, shop_name, open, closed_notice, support_contact, community_link, created_at, updated_at
       FROM store_settings
       WHERE seller_id = $1`,
      [sellerId]
    );

    return selected.rows[0] || {
      seller_id: sellerId,
      ...memorySettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      return { seller_id: sellerId, ...memorySettings };
    }

    throw error;
  }
}

async function updateSellerSettings(sellerId, payload) {
  try {
    const nextSettings = {
      shop_name: payload.shop_name ?? memorySettings.shop_name,
      open: payload.open ?? memorySettings.open,
      closed_notice: payload.closed_notice ?? memorySettings.closed_notice,
      support_contact: payload.support_contact ?? memorySettings.support_contact,
      community_link: payload.community_link ?? memorySettings.community_link
    };

    const result = await pool.query(
      `INSERT INTO store_settings (seller_id, shop_name, open, closed_notice, support_contact, community_link)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (seller_id) DO UPDATE
       SET shop_name = EXCLUDED.shop_name,
           open = EXCLUDED.open,
           closed_notice = EXCLUDED.closed_notice,
           support_contact = EXCLUDED.support_contact,
           community_link = EXCLUDED.community_link,
           updated_at = NOW()
       RETURNING seller_id, shop_name, open, closed_notice, support_contact, community_link, created_at, updated_at`,
      [sellerId, nextSettings.shop_name, nextSettings.open, nextSettings.closed_notice, nextSettings.support_contact, nextSettings.community_link]
    );

    return result.rows[0];
  } catch (error) {
    if (shouldUseMemoryFallback(error)) {
      memorySettings = {
        shop_name: payload.shop_name ?? memorySettings.shop_name,
        open: payload.open ?? memorySettings.open,
        closed_notice: payload.closed_notice ?? memorySettings.closed_notice,
        support_contact: payload.support_contact ?? memorySettings.support_contact,
        community_link: payload.community_link ?? memorySettings.community_link
      };
      return { seller_id: sellerId, ...memorySettings };
    }

    throw error;
  }
}

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  listOrders,
  createOrder,
  addMockOrder,
  requestWithdrawal,
  listWithdrawals,
  getSellerSettings,
  updateSellerSettings
};
