const { Pool } = require("pg");
const env = require("../config/env");

function getSslConfig() {
  if (env.NODE_ENV !== "production") {
    return false;
  }

  // Most managed Postgres providers (Render, Supabase, Neon) use trusted CAs.
  // Only disable verification if the operator explicitly opts out.
  if (process.env.DATABASE_SSLMODE === "no-verify") {
    return { rejectUnauthorized: false };
  }

  return { rejectUnauthorized: true };
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

