import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    notes?: string;
  };

  const contactResult = await db.query(
    `
      select
        p.id as property_id,
        u.id as unit_id,
        c.id as contact_id,
        c.phone_e164
      from residential_units u
      join properties p on p.id = u.property_id
      join residents r on r.unit_id = u.id and r.is_active = true
      join resident_contacts c on c.resident_id = r.id and c.is_active = true and c.call_enabled = true
      where
        u.id = $1
        and u.is_active = true
        and ($2::uuid is null or p.id = $2::uuid)
      order by c.priority asc
      limit 1
    `,
    [id, session.propertyId],
  );

  if (contactResult.rowCount === 0) {
    return Response.json(
      { error: "No hay contacto habilitado para llamada" },
      { status: 404 },
    );
  }

  const contact = contactResult.rows[0];
  const logResult = await db.query(
    `
      insert into call_logs (property_id, unit_id, contact_id, initiated_by, status, notes)
      values ($1, $2, $3, $4, $5, $6)
      returning id, status, started_at
    `,
    [
      contact.property_id,
      contact.unit_id,
      contact.contact_id,
      session.userId,
      body.status ?? "initiated",
      body.notes ?? "Intento registrado desde app de porteria",
    ],
  );

  await auditEvent({
    propertyId: contact.property_id,
    actorUserId: session.userId,
    action: "porter.call.create",
    entityType: "call_logs",
    entityId: logResult.rows[0].id,
    metadata: {
      unitId: contact.unit_id,
      status: logResult.rows[0].status,
    },
  });

  return Response.json({
    call: {
      id: logResult.rows[0].id,
      status: logResult.rows[0].status,
      startedAt: logResult.rows[0].started_at,
      phoneE164: contact.phone_e164,
      message: "Intento de llamada registrado. Numero real protegido.",
    },
  });
}
