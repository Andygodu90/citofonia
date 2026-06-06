import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

function isTransientDatabaseError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    return (
      message.includes("fetch failed") ||
      message.includes("econnreset") ||
      message.includes("timeout") ||
      message.includes("error connecting to database")
    );
  }

  return String(error).toLowerCase().includes("errorevent");
}

async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  const delays = [0, 350, 900];
  let lastError: unknown;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientDatabaseError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export const db = {
  query<T extends object = Record<string, string>>(
    text: string,
    values?: unknown[],
  ) {
    return withDatabaseRetry(() => pool.query<T>(text, values));
  },

  async connect() {
    const client = await withDatabaseRetry(() => pool.connect());
    const originalQuery = client.query.bind(client);

    client.query = ((text: string, values?: unknown[]) =>
      withDatabaseRetry(() => originalQuery(text, values))) as typeof client.query;

    return client;
  },
};
