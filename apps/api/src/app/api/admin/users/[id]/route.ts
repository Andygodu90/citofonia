import { auditEvent, hashPassword, requireAdminSession } from "@/lib/auth";
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
    password?: string;
    role?: string;
    username?: string;
  };
  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";

  if (
    typeof body.isActive !== "boolean" &&
    body.role === undefined &&
    username === undefined &&
    password === ""
  ) {
    return Response.json({ error: "No hay cambios para aplicar" }, { status: 400 });
  }

  if (username !== undefined && username.length === 0) {
    return Response.json({ error: "El usuario no puede quedar vacío" }, { status: 400 });
  }

  if (password && password.length < 8) {
    return Response.json(
      { error: "La nueva contraseña debe tener mínimo 8 caracteres" },
      { status: 400 },
    );
  }

  if (id === session.userId && body.isActive === false) {
    return Response.json(
      { error: "No puedes desactivar tu propio usuario activo" },
      { status: 409 },
    );
  }

  const allowedRoles =
    session.role === "superadmin"
      ? ["superadmin", "admin", "porter"]
      : ["admin", "porter"];
  const role = body.role && allowedRoles.includes(body.role) ? body.role : null;

  const result = await db.query(
    `
      update app_users
      set
        is_active = coalesce($1, is_active),
        role = coalesce($2, role),
        username = coalesce($5, username),
        password_hash = coalesce($6, password_hash),
        updated_at = now()
      where id = $3 and ($4::uuid is null or property_id = $4::uuid)
      returning id, username, role, is_active
    `,
    [
      body.isActive ?? null,
      role,
      id,
      session.propertyId,
      username ?? null,
      password ? hashPassword(password) : null,
    ],
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
      username,
      changedPassword: Boolean(password),
    },
  });

  return Response.json({ user: result.rows[0] });
}
