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
    message?: string;
  };

  const message = body.message?.trim() || "Mensaje de prueba desde porteria";

  const contactResult = await db.query(
    `
      select
        p.id as property_id,
        u.id as unit_id,
        c.id as contact_id
      from residential_units u
      join properties p on p.id = u.property_id
      join residents r on r.unit_id = u.id and r.is_active = true
      join resident_contacts c on c.resident_id = r.id and c.is_active = true and c.whatsapp_enabled = true
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
      { error: "No hay contacto habilitado para chat" },
      { status: 404 },
    );
  }

  const contact = contactResult.rows[0];

  const threadResult = await db.query(
    `
      insert into whatsapp_threads (property_id, unit_id, contact_id, status)
      values ($1, $2, $3, 'open')
      returning id
    `,
    [contact.property_id, contact.unit_id, contact.contact_id],
  );

  const messageResult = await db.query(
    `
      insert into whatsapp_messages (thread_id, direction, body, sent_by)
      values ($1, 'outbound', $2, $3)
      returning id, sent_at
    `,
    [threadResult.rows[0].id, message, session.userId],
  );

  await auditEvent({
    propertyId: contact.property_id,
    actorUserId: session.userId,
    action: "porter.message.create",
    entityType: "whatsapp_messages",
    entityId: messageResult.rows[0].id,
    metadata: {
      unitId: contact.unit_id,
      threadId: threadResult.rows[0].id,
    },
  });

  return Response.json({
    thread: {
      id: threadResult.rows[0].id,
      messageId: messageResult.rows[0].id,
      sentAt: messageResult.rows[0].sent_at,
      status: "mocked",
      message:
        "Mensaje guardado en historial interno. WhatsApp Business se integrara en una fase posterior.",
    },
  });
}
