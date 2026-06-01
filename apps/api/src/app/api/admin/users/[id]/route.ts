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
    role?: string;
  };

  if (typeof body.isActive !== "boolean" && body.role === undefined) {
    return Response.json({ error: "No hay cambios para aplicar" }, { status: 400 });
  }

  if (id === session.userId && body.isActive === false) {
    return Response.json(
      { error: "No puedes desactivar tu propio usuario activo" },
      { status: 409 },
    );
  }

  const role = body.role === "admin" || body.role === "porter" ? body.role : null;

  const result = await db.query(
    `
      update app_users
      set
        is_active = coalesce($1, is_active),
        role = coalesce($2, role),
        updated_at = now()
      where id = $3 and ($4::uuid is null or property_id = $4::uuid)
      returning id, username, role, is_active
    `,
    [body.isActive ?? null, role, id, session.propertyId],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action:
      typeof body.isActive === "boolean"
        ? body.isActive
          ? "admin.user.activate"
          : "admin.user.deactivate"
        : "admin.user.update",
    entityType: "app_users",
    entityId: id,
    metadata: {
      isActive: body.isActive,
      role,
    },
  });

  return Response.json({ user: result.rows[0] });
}
