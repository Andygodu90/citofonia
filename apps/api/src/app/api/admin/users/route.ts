import { auditEvent, hashPassword, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query(
    `
      select id, username, role, is_active, last_login_at, created_at
      from app_users
      where $1::uuid is null or property_id = $1::uuid
      order by created_at desc
      limit 50
    `,
    [session.propertyId],
  );

  return Response.json({ users: result.rows });
}

export async function POST(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    role?: string;
  };

  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";
  const requestedRole = body.role?.trim() ?? "porter";
  const allowedRoles =
    session.role === "superadmin"
      ? ["superadmin", "admin", "porter"]
      : ["admin", "porter"];
  const role = allowedRoles.includes(requestedRole) ? requestedRole : "porter";

  if (!username || password.length < 8) {
    return Response.json(
      { error: "Usuario y contrasena de minimo 8 caracteres son obligatorios" },
      { status: 400 },
    );
  }

  const result = await db.query(
    `
      insert into app_users (property_id, username, password_hash, role)
      values ($1, $2, $3, $4)
      on conflict (username)
      do update set
        password_hash = excluded.password_hash,
        role = excluded.role,
        is_active = true,
        updated_at = now()
      returning id, username, role, is_active
    `,
    [session.propertyId, username, hashPassword(password), role],
  );

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action: "admin.user.upsert",
    entityType: "app_users",
    entityId: result.rows[0].id,
    metadata: {
      username,
      role,
    },
  });

  return Response.json({ user: result.rows[0] });
}
