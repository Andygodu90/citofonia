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
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
  };

  const status = body.status === "delivered" ? "delivered" : "received";
  const result = await db.query(
    `
      update package_deliveries pd
      set
        status = $1,
        delivered_at = case when $1 = 'delivered' then now() else delivered_at end,
        updated_at = now()
      from properties p
      where
        pd.id = $2
        and p.id = pd.property_id
        and ($3::uuid is null or p.id = $3::uuid)
      returning pd.id, pd.property_id, pd.unit_id, pd.status, pd.delivered_at
    `,
    [status, id, session.propertyId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Paquete no encontrado" }, { status: 404 });
  }

  const item = result.rows[0];

  await auditEvent({
    propertyId: item.property_id,
    actorUserId: session.userId,
    action: "porter.package.update",
    entityType: "package_deliveries",
    entityId: item.id,
    metadata: {
      unitId: item.unit_id,
      status: item.status,
    },
  });

  return Response.json({
    package: {
      id: item.id,
      status: item.status,
      deliveredAt: item.delivered_at,
    },
    message:
      item.status === "delivered"
        ? "Paquete marcado como entregado."
        : "Paquete actualizado.",
  });
}
