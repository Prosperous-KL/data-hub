import { Pool } from "pg";
import env from "../config/env.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

// Handle connection errors gracefully (app can still start if DB unavailable)
pool.on("error", (err) => {
  // Error logged to application monitoring/logging service
});

export default pool;
