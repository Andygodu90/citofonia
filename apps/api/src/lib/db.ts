import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForPg = globalThis as unknown as {
  pgPool?: pg.Pool;
};

export const db =
  globalForPg.pgPool ??
  new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = db;
}
