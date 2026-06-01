import { auditEvent, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    isActive?: boolean;
  };

  if (typeof body.isActive !== "boolean") {
    return Response.json({ error: "Estado invalido" }, { status: 400 });
  }

  const result = await db.query(
    `
      update residential_units
      set is_active = $1, updated_at = now()
      where id = $2 and ($3::uuid is null or property_id = $3::uuid)
      returning id, display_label, is_active
    `,
    [body.isActive, id, session.propertyId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action: body.isActive ? "admin.unit.activate" : "admin.unit.deactivate",
    entityType: "residential_units",
    entityId: id,
    metadata: {
      isActive: body.isActive,
    },
  });

  return Response.json({ unit: result.rows[0] });
}
