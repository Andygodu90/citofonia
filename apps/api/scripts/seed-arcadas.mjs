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

const residents = [
  "Camila Torres",
  "Daniel Ruiz",
  "Laura Mendoza",
  "Santiago Perez",
  "Paula Gomez",
  "Felipe Castro",
  "Valentina Rojas",
  "Andres Moreno",
  "Juliana Vargas",
  "Nicolas Herrera",
  "Marcela Diaz",
  "Juan Ramirez",
];

await client.connect();
await client.query("begin");

try {
  const propertyResult = await client.query(
    `
      insert into properties (name, address, contact_phone)
      values ($1, $2, $3)
      on conflict do nothing
      returning id
    `,
    [
      "Conjunto Residencial Arcadas de San Isidro",
      "Direccion de prueba pendiente por definir",
      "+570000000000",
    ],
  );

  let propertyId = propertyResult.rows[0]?.id;

  if (!propertyId) {
    const existing = await client.query(
      "select id from properties where name = $1 limit 1",
      ["Conjunto Residencial Arcadas de San Isidro"],
    );
    propertyId = existing.rows[0].id;
  }

  let createdUnits = 0;
  let createdResidents = 0;
  let createdContacts = 0;

  for (let block = 31; block <= 45; block += 1) {
    for (let floor = 1; floor <= 5; floor += 1) {
      for (const letter of ["A", "B", "C", "D"]) {
        const unitNumber = `${floor}${letter}`;
        const displayLabel = `Bloque ${block} - Apto ${unitNumber}`;

        const unitResult = await client.query(
          `
            insert into residential_units (property_id, tower, unit_number, display_label)
            values ($1, $2, $3, $4)
            on conflict (property_id, tower, unit_number)
            do update set display_label = excluded.display_label, updated_at = now()
            returning id, (xmax = 0) as inserted
          `,
          [propertyId, String(block), unitNumber, displayLabel],
        );

        const unitId = unitResult.rows[0].id;
        if (unitResult.rows[0].inserted) {
          createdUnits += 1;
        }

        const residentIndex = (block + floor + letter.charCodeAt(0)) % residents.length;
        const fullName = residents[residentIndex];
        const documentId = `TEST-${block}-${unitNumber}`;
        const email = `residente.${block}.${unitNumber.toLowerCase()}@example.com`;

        const residentResult = await client.query(
          `
            insert into residents (unit_id, full_name, document_id, email, resident_type)
            select $1, $2, $3, $4, 'owner'
            where not exists (
              select 1 from residents where unit_id = $1 and document_id = $3
            )
            returning id
          `,
          [unitId, fullName, documentId, email],
        );

        let residentId = residentResult.rows[0]?.id;
        if (residentId) {
          createdResidents += 1;
        } else {
          const existingResident = await client.query(
            "select id from residents where unit_id = $1 and document_id = $2 limit 1",
            [unitId, documentId],
          );
          residentId = existingResident.rows[0].id;
        }

        const phoneSuffix = `${block}${floor}${letter.charCodeAt(0)}`.padStart(7, "0");
        const phone = `+57300${phoneSuffix}`;

        const contactResult = await client.query(
          `
            insert into resident_contacts (resident_id, contact_type, phone_e164, priority)
            select $1, 'primary', $2, 1
            where not exists (
              select 1 from resident_contacts where resident_id = $1 and contact_type = 'primary'
            )
            returning id
          `,
          [residentId, phone],
        );

        if (contactResult.rowCount > 0) {
          createdContacts += 1;
        }
      }
    }
  }

  await client.query("commit");

  console.table({
    property: "Conjunto Residencial Arcadas de San Isidro",
    createdUnits,
    createdResidents,
    createdContacts,
    expectedUnits: 300,
  });
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
