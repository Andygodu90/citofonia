import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Create apps/api/.env.local first.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: true,
  },
});
const schemaPath = join(process.cwd(), "database", "schema.sql");
const schema = await readFile(schemaPath, "utf8");

await client.connect();
await client.query(schema);
await client.end();

console.log("Database schema initialized successfully.");
