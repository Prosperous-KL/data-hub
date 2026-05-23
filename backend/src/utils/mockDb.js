// mockDb.js
// Extracted memory fallbacks for local development when PostgreSQL is unavailable.
// These are disabled in production to prevent data loss.

const memoryUsers = [];
const memoryOtps = [];
const memoryWallets = new Map();
const memoryPurchases = [];
const memoryProducts = [];
const memoryOrders = [];
const memoryIdempotencyStore = new Map();
const memoryTokenBlacklist = [];

module.exports = {
  memoryUsers,
  memoryOtps,
  memoryWallets,
  memoryPurchases,
  memoryProducts,
  memoryOrders,
  memoryIdempotencyStore,
  memoryTokenBlacklist
};
