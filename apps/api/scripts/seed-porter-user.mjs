import { pbkdf2Sync, randomBytes } from "node:crypto";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Create apps/api/.env.local first.");
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const iterations = 120_000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString(
    "base64url",
  );

  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

const username = "porteria";
const password = "Porteria123*";
const passwordHash = hashPassword(password);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: true,
  },
});

await client.connect();

const propertyResult = await client.query(
  "select id from properties where name = $1 limit 1",
  ["Conjunto Residencial Arcadas de San Isidro"],
);

if (propertyResult.rowCount === 0) {
  await client.end();
  console.error("Arcadas property not found. Run db:seed:arcadas first.");
  process.exit(1);
}

await client.query(
  `
    insert into app_users (property_id, username, password_hash, role)
    values ($1, $2, $3, 'porter')
    on conflict (username)
    do update set
      property_id = excluded.property_id,
      password_hash = excluded.password_hash,
      role = excluded.role,
      is_active = true,
      failed_login_attempts = 0,
      updated_at = now()
  `,
  [propertyResult.rows[0].id, username, passwordHash],
);

await client.end();

console.table({
  username,
  password,
  role: "porter",
});
