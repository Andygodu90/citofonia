import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = new Set([
  "initiated",
  "answered",
  "no_answer",
  "rejected",
  "failed",
]);

export async function PATCH(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    notes?: string;
    ended?: boolean;
  };

  const status = body.status?.trim() || "initiated";

  if (!allowedStatuses.has(status)) {
    return Response.json({ error: "Estado de llamada invalido" }, { status: 400 });
  }

  const result = await db.query(
    `
      update call_logs cl
      set
        status = $1,
        notes = coalesce($2, notes),
        ended_at = case when $3 then now() else ended_at end
      from properties p
      where
        cl.id = $4
        and p.id = cl.property_id
        and ($5::uuid is null or p.id = $5::uuid)
      returning cl.id, cl.property_id, cl.unit_id, cl.status, cl.started_at, cl.ended_at
    `,
    [status, body.notes?.trim() || null, Boolean(body.ended), id, session.propertyId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Llamada no encontrada" }, { status: 404 });
  }

  const call = result.rows[0];

  await auditEvent({
    propertyId: call.property_id,
    actorUserId: session.userId,
    action: "porter.call.update",
    entityType: "call_logs",
    entityId: call.id,
    metadata: {
      unitId: call.unit_id,
      status,
      ended: Boolean(body.ended),
    },
  });

  return Response.json({
    call: {
      id: call.id,
      status: call.status,
      startedAt: call.started_at,
      endedAt: call.ended_at,
    },
  });
}
