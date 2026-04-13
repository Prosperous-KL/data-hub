const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function setupDB() {
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  try {
    await client.connect();
    await client.query(schema);
    console.log("Database setup complete");
  } finally {
    await client.end();
  }
}

setupDB().catch((error) => {
  console.error("Database setup failed:", error.message);
  process.exit(1);
});