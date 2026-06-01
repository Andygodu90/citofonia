import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type AuditRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  actor: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action")?.trim() ?? "";

  const result = await db.query<AuditRow>(
    `
      select
        ae.id,
        ae.action,
        ae.entity_type,
        ae.entity_id,
        ae.metadata,
        au.username as actor,
        ae.created_at
      from audit_events ae
      left join app_users au on au.id = ae.actor_user_id
      where
        ($1::uuid is null or ae.property_id = $1::uuid)
        and ($2 = '' or ae.action ilike '%' || $2 || '%')
      order by ae.created_at desc
      limit 80
    `,
    [session.propertyId, action],
  );

  return Response.json({
    items: result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actor: row.actor,
      metadata: row.metadata,
      createdAt: row.created_at,
    })),
  });
}
