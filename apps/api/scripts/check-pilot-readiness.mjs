import pg from "pg";

const required = [
  ["DATABASE_URL", 20],
  ["AUTH_SECRET", 32],
  ["WHATSAPP_ACCESS_TOKEN", 20],
  ["WHATSAPP_PHONE_NUMBER_ID", 1],
  ["WHATSAPP_VERIFY_TOKEN", 8],
  ["WHATSAPP_TEMPLATE_AUTHORIZATION_NAME", 1],
  ["WHATSAPP_TEMPLATE_AUTHORIZATION_LANGUAGE", 2],
];

function checkEnv(name, minLength) {
  const value = process.env[name] ?? "";

  return {
    name,
    configured: value.length >= minLength,
    length: value.length,
  };
}

const envChecks = required.map(([name, minLength]) => checkEnv(name, minLength));
const missing = envChecks.filter((item) => !item.configured);

let database = {
  ok: false,
  error: null,
};

if (process.env.DATABASE_URL) {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    await client.connect();
    await client.query("select 1");
    database = { ok: true, error: null };
  } catch (error) {
    database = {
      ok: false,
      error: error instanceof Error ? error.message : "Database unavailable",
    };
  } finally {
    await client.end().catch(() => {});
  }
}

console.table(
  envChecks.map((item) => ({
    variable: item.name,
    status: item.configured ? "ok" : "pending",
    length: item.length,
  })),
);

console.table({
  database: database.ok ? "ok" : "pending",
  appPublicBaseUrl: process.env.APP_PUBLIC_BASE_URL ? "configured" : "pending",
  template: process.env.WHATSAPP_TEMPLATE_AUTHORIZATION_NAME ?? "pending",
});

if (database.error) {
  console.error(`Database check: ${database.error}`);
}

if (missing.length > 0 || !database.ok) {
  process.exitCode = 1;
} else {
  console.log("Pilot readiness check passed.");
}
