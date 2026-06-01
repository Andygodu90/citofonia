import { auditEvent, createToken, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return Response.json(
      { error: "Usuario y contrasena son obligatorios" },
      { status: 400 },
    );
  }

  const result = await db.query(
    `
      select
        id,
        property_id,
        username,
        password_hash,
        role,
        is_active
      from app_users
      where lower(username) = $1
      limit 1
    `,
    [username],
  );

  const user = result.rows[0];

  if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
    if (user?.id) {
      await db.query(
        `
          update app_users
          set failed_login_attempts = failed_login_attempts + 1,
              updated_at = now()
          where id = $1
        `,
        [user.id],
      );
    }

    return Response.json(
      { error: "Credenciales invalidas" },
      { status: 401 },
    );
  }

  await db.query(
    `
      update app_users
      set failed_login_attempts = 0,
          last_login_at = now(),
          updated_at = now()
      where id = $1
    `,
    [user.id],
  );

  await auditEvent({
    propertyId: user.property_id,
    actorUserId: user.id,
    action: "auth.login",
    entityType: "app_users",
    entityId: user.id,
  });

  const token = createToken({
    sub: user.id,
    username: user.username,
    role: user.role,
    propertyId: user.property_id,
  });

  return Response.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      propertyId: user.property_id,
    },
  });
}
