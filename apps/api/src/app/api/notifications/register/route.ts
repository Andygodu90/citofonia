import { getBearerToken, verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    expoPushToken?: string;
    platform?: string;
  };

  const expoPushToken = body.expoPushToken?.trim();

  if (!expoPushToken) {
    return Response.json({ error: "Token push obligatorio" }, { status: 400 });
  }

  const result = await db.query(
    `
      insert into device_push_tokens (
        property_id,
        user_id,
        role,
        expo_push_token,
        platform,
        is_active
      )
      values ($1, $2, $3, $4, $5, true)
      on conflict (user_id, expo_push_token)
      do update set
        role = excluded.role,
        property_id = excluded.property_id,
        platform = excluded.platform,
        is_active = true,
        updated_at = now()
      returning id
    `,
    [
      session.propertyId,
      session.userId,
      session.role,
      expoPushToken,
      body.platform?.trim() || null,
    ],
  );

  return Response.json({ token: { id: result.rows[0].id } });
}
