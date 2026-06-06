import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Create apps/api/.env.local first.");
  process.exit(1);
}

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const pool = new Pool({
  connectionString: databaseUrl,
});
const schemaPath = join(process.cwd(), "database", "schema.sql");
const schema = await readFile(schemaPath, "utf8");
const statements = schema
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await pool.query(`${statement};`);
}

await pool.end();

console.log("Database schema initialized successfully.");
