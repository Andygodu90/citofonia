import { auditEvent, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type ImportResidentRow = {
  line: number;
  block: string;
  unitNumber: string;
  fullName: string;
  documentId: string | null;
  email: string | null;
  phone: string | null;
  residentType: string;
};

const MAX_ROWS = 1000;

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function getValue(
  row: Record<string, string>,
  candidates: string[],
  fallback = "",
) {
  for (const candidate of candidates) {
    const value = row[normalizeHeader(candidate)];

    if (value) {
      return value.trim();
    }
  }

  return fallback;
}

function normalizePhone(phone: string) {
  const clean = phone.replace(/[^\d+]/g, "");

  if (!clean) {
    return null;
  }

  if (clean.startsWith("+")) {
    return clean;
  }

  if (clean.length === 10) {
    return `+57${clean}`;
  }

  if (clean.length === 12 && clean.startsWith("57")) {
    return `+${clean}`;
  }

  return clean;
}

function parseResidentsCsv(csv: string) {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [] as ImportResidentRow[], errors: ["El CSV no tiene datos."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows: ImportResidentRow[] = [];
  const errors: string[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const raw: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      raw[header] = values[headerIndex]?.trim() ?? "";
    });

    const block = getValue(raw, ["bloque", "block", "torre", "tower"]);
    const unitNumber = getValue(raw, [
      "apto",
      "apartamento",
      "unit",
      "unitNumber",
      "unidad",
    ]).toUpperCase();
    const fullName = getValue(raw, [
      "nombre",
      "fullName",
      "residentName",
      "residente",
    ]);

    if (!block || !unitNumber || !fullName) {
      errors.push(
        `Linea ${index + 1}: bloque, apartamento y nombre son obligatorios.`,
      );
      continue;
    }

    rows.push({
      line: index + 1,
      block,
      unitNumber,
      fullName,
      documentId:
        getValue(raw, ["documento", "documentId", "cedula", "identificacion"]) ||
        null,
      email: getValue(raw, ["email", "correo"]) || null,
      phone: normalizePhone(getValue(raw, ["telefono", "phone", "whatsapp"])),
      residentType: getValue(raw, ["tipo", "residentType"], "resident"),
    });
  }

  return { rows, errors };
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    csv?: string;
    dryRun?: boolean;
  };

  if (!body.csv?.trim()) {
    return Response.json(
      { error: "Debes enviar el contenido CSV en el campo csv." },
      { status: 400 },
    );
  }

  const { rows, errors } = parseResidentsCsv(body.csv);

  if (rows.length > MAX_ROWS) {
    return Response.json(
      { error: `La carga permite maximo ${MAX_ROWS} filas por solicitud.` },
      { status: 400 },
    );
  }

  if (body.dryRun) {
    return Response.json({
      dryRun: true,
      parsedRows: rows.length,
      errors,
      sample: rows.slice(0, 5),
    });
  }

  const client = await db.connect();
  const importedResidentIds: string[] = [];
  const skippedRows: string[] = [...errors];
  let createdResidents = 0;
  let updatedResidents = 0;
  let createdContacts = 0;
  let updatedContacts = 0;

  try {
    await client.query("begin");

    for (const row of rows) {
      const unit = await client.query(
        `
          select id
          from residential_units
          where tower = $1
            and upper(unit_number) = upper($2)
            and ($3::uuid is null or property_id = $3::uuid)
          limit 1
        `,
        [row.block, row.unitNumber, session.propertyId],
      );

      if ((unit.rowCount ?? 0) === 0) {
        skippedRows.push(
          `Linea ${row.line}: no existe la unidad Bloque ${row.block} - Apto ${row.unitNumber}.`,
        );
        continue;
      }

      const unitId = unit.rows[0].id as string;
      const existingResident = row.documentId
        ? await client.query(
            `
              select id
              from residents
              where unit_id = $1 and document_id = $2
              limit 1
            `,
            [unitId, row.documentId],
          )
        : { rowCount: 0, rows: [] };

      let residentId = existingResident.rows[0]?.id as string | undefined;

      if (residentId) {
        await client.query(
          `
            update residents
            set full_name = $2,
                email = $3,
                resident_type = $4,
                is_active = true,
                updated_at = now()
            where id = $1
          `,
          [residentId, row.fullName, row.email, row.residentType],
        );
        updatedResidents += 1;
      } else {
        const resident = await client.query(
          `
            insert into residents (
              unit_id,
              full_name,
              document_id,
              email,
              resident_type
            )
            values ($1, $2, $3, $4, $5)
            returning id
          `,
          [unitId, row.fullName, row.documentId, row.email, row.residentType],
        );
        residentId = resident.rows[0].id;
        createdResidents += 1;
      }

      if (!residentId) {
        skippedRows.push(
          `Linea ${row.line}: no se pudo resolver el residente importado.`,
        );
        continue;
      }

      importedResidentIds.push(residentId);

      if (row.phone) {
        const existingContact = await client.query(
          `
            select id
            from resident_contacts
            where resident_id = $1 and contact_type = 'primary'
            limit 1
          `,
          [residentId],
        );

        if ((existingContact.rowCount ?? 0) > 0) {
          await client.query(
            `
              update resident_contacts
              set phone_e164 = $2,
                  whatsapp_enabled = true,
                  call_enabled = true,
                  is_active = true,
                  updated_at = now()
              where id = $1
            `,
            [existingContact.rows[0].id, row.phone],
          );
          updatedContacts += 1;
        } else {
          await client.query(
            `
              insert into resident_contacts (
                resident_id,
                contact_type,
                phone_e164,
                priority
              )
              values ($1, 'primary', $2, 1)
            `,
            [residentId, row.phone],
          );
          createdContacts += 1;
        }
      }
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action: "admin.residents.import",
    entityType: "residents",
    metadata: {
      parsedRows: rows.length,
      createdResidents,
      updatedResidents,
      createdContacts,
      updatedContacts,
      skippedRows: skippedRows.length,
    },
  });

  return Response.json({
    imported: importedResidentIds.length,
    createdResidents,
    updatedResidents,
    createdContacts,
    updatedContacts,
    skippedRows,
  });
}
