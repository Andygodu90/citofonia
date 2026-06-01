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

const username = "residente";
const password = "Residente123*";
const passwordHash = hashPassword(password);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: true,
  },
});

await client.connect();

const residentResult = await client.query(
  `
    select
      r.id as resident_id,
      u.property_id,
      u.display_label
    from residents r
    join residential_units u on u.id = r.unit_id
    join properties p on p.id = u.property_id
    where
      p.name = $1
      and u.tower = '31'
      and u.unit_number = '1A'
    order by r.created_at asc
    limit 1
  `,
  ["Conjunto Residencial Arcadas de San Isidro"],
);

if ((residentResult.rowCount ?? 0) === 0) {
  await client.end();
  console.error("Resident for Bloque 31 - Apto 1A not found. Run db:seed:arcadas first.");
  process.exit(1);
}

const resident = residentResult.rows[0];

await client.query(
  `
    insert into app_users (property_id, resident_id, username, password_hash, role)
    values ($1, $2, $3, $4, 'resident')
    on conflict (username)
    do update set
      property_id = excluded.property_id,
      resident_id = excluded.resident_id,
      password_hash = excluded.password_hash,
      role = excluded.role,
      is_active = true,
      failed_login_attempts = 0,
      updated_at = now()
  `,
  [resident.property_id, resident.resident_id, username, passwordHash],
);

await client.end();

console.table({
  username,
  password,
  role: "resident",
  unit: resident.display_label,
});
