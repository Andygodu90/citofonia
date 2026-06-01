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
    fullName?: string;
    documentId?: string | null;
    email?: string | null;
    isActive?: boolean;
  };

  if (
    body.fullName === undefined &&
    body.documentId === undefined &&
    body.email === undefined &&
    body.isActive === undefined
  ) {
    return Response.json({ error: "No hay cambios para aplicar" }, { status: 400 });
  }

  const result = await db.query(
    `
      update residents r
      set
        full_name = coalesce(nullif($1, ''), r.full_name),
        document_id = case when $2::text is null then r.document_id else nullif($2, '') end,
        email = case when $3::text is null then r.email else nullif($3, '') end,
        is_active = coalesce($4, r.is_active),
        updated_at = now()
      from residential_units u
      where
        r.id = $5
        and u.id = r.unit_id
        and ($6::uuid is null or u.property_id = $6::uuid)
      returning r.id, r.full_name, r.document_id, r.email, r.is_active
    `,
    [
      body.fullName?.trim() ?? null,
      body.documentId === undefined ? null : body.documentId?.trim() ?? "",
      body.email === undefined ? null : body.email?.trim() ?? "",
      body.isActive ?? null,
      id,
      session.propertyId,
    ],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Residente no encontrado" }, { status: 404 });
  }

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action:
      typeof body.isActive === "boolean"
        ? body.isActive
          ? "admin.resident.activate"
          : "admin.resident.deactivate"
        : "admin.resident.update",
    entityType: "residents",
    entityId: id,
    metadata: {
      isActive: body.isActive,
      changedName: body.fullName !== undefined,
      changedDocument: body.documentId !== undefined,
      changedEmail: body.email !== undefined,
    },
  });

  return Response.json({ resident: result.rows[0] });
}
