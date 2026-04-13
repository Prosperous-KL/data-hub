const fs = require("fs/promises");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

function getSslConfig(connectionString) {
	const sslRequired =
		process.env.PGSSLMODE === "require" ||
		/render|railway|supabase|neon/i.test(connectionString || "");

	return sslRequired ? { rejectUnauthorized: false } : false;
}

async function setupDB() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not set in backend/.env");
	}

	const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
	const schema = await fs.readFile(schemaPath, "utf8");

	const client = new Client({
		connectionString,
		ssl: getSslConfig(connectionString)
	});

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
