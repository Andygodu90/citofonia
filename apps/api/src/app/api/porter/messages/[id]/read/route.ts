import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await db.query(
    `
      update whatsapp_messages wm
      set read_at = coalesce(wm.read_at, now())
      from whatsapp_threads wt
      join properties p on p.id = wt.property_id
      where
        wm.id = $1
        and wt.id = wm.thread_id
        and wm.direction = 'inbound'
        and ($2::uuid is null or p.id = $2::uuid)
      returning wm.id, wt.property_id, wt.unit_id, wm.read_at
    `,
    [id, session.propertyId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }

  const message = result.rows[0];

  await auditEvent({
    propertyId: message.property_id,
    actorUserId: session.userId,
    action: "porter.message.read",
    entityType: "whatsapp_messages",
    entityId: message.id,
    metadata: {
      unitId: message.unit_id,
      readAt: message.read_at,
    },
  });

  return Response.json({
    message: {
      id: message.id,
      readAt: message.read_at,
    },
  });
}
