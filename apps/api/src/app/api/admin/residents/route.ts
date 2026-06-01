import { auditEvent, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  const result = await db.query(
    `
      select
        r.id,
        r.full_name,
        r.document_id,
        r.email,
        r.resident_type,
        r.is_active,
        u.display_label as unit_label,
        coalesce(min(c.phone_e164), '') as phone
      from residents r
      join residential_units u on u.id = r.unit_id
      left join resident_contacts c on c.resident_id = r.id and c.is_active = true
      where
        ($1::uuid is null or u.property_id = $1::uuid)
        and (
          $2 = ''
          or r.full_name ilike '%' || $2 || '%'
          or r.document_id ilike '%' || $2 || '%'
          or u.display_label ilike '%' || $2 || '%'
        )
      group by r.id, u.display_label
      order by u.display_label, r.full_name
      limit 60
    `,
    [session.propertyId, query],
  );

  return Response.json({ residents: result.rows });
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    unitId?: string;
    fullName?: string;
    documentId?: string;
    email?: string;
    phone?: string;
  };

  if (!body.unitId || !body.fullName?.trim()) {
    return Response.json(
      { error: "Unidad y nombre son obligatorios" },
      { status: 400 },
    );
  }

  const client = await db.connect();

  try {
    await client.query("begin");

    const unit = await client.query(
      "select id from residential_units where id = $1 and ($2::uuid is null or property_id = $2::uuid)",
      [body.unitId, session.propertyId],
    );

    if ((unit.rowCount ?? 0) === 0) {
      await client.query("rollback");
      return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
    }

    const resident = await client.query(
      `
        insert into residents (unit_id, full_name, document_id, email, resident_type)
        values ($1, $2, $3, $4, 'resident')
        returning id, full_name
      `,
      [
        body.unitId,
        body.fullName.trim(),
        body.documentId?.trim() || null,
        body.email?.trim() || null,
      ],
    );

    if (body.phone?.trim()) {
      await client.query(
        `
          insert into resident_contacts (resident_id, contact_type, phone_e164, priority)
          values ($1, 'primary', $2, 1)
        `,
        [resident.rows[0].id, body.phone.trim()],
      );
    }

    await client.query("commit");

    await auditEvent({
      propertyId: session.propertyId,
      actorUserId: session.userId,
      action: "admin.resident.create",
      entityType: "residents",
      entityId: resident.rows[0].id,
      metadata: {
        unitId: body.unitId,
        hasPhone: Boolean(body.phone?.trim()),
      },
    });

    return Response.json({ resident: resident.rows[0] });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
