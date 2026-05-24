const { Pool } = require("pg");
const env = require("../config/env");

function getSslConfig() {
  if (!env.DATABASE_URL) {
    return false;
  }

  const isLocal = env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1");
  if (isLocal) {
    return false;
  }

  // Most managed Postgres providers (Render, Supabase, Neon) require SSL.
  if (process.env.DATABASE_SSLMODE === "no-verify") {
    return { rejectUnauthorized: false };
  }

  // Disable rejectUnauthorized for SSL connections to prevent cert chain issues with managed DBs
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: getSslConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

// Handle unexpected connection errors on idle clients
pool.on("error", (err) => {
  console.error("[pool] Unexpected idle-client error:", err.message);
});

module.exports = pool;

