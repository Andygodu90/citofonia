import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    unitId: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { unitId } = await params;
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 50);

  const result = await db.query(
    `
      select
        wm.id,
        wt.id as thread_id,
        wm.direction,
        wm.body,
        wm.provider_status,
        wm.sent_at,
        wm.delivered_at,
        wm.read_at
      from whatsapp_threads wt
      join whatsapp_messages wm on wm.thread_id = wt.id
      join residential_units u on u.id = wt.unit_id
      where
        wt.unit_id = $1
        and ($2::uuid is null or u.property_id = $2::uuid)
        and ($3::timestamptz is null or wm.sent_at < $3::timestamptz)
      order by wm.sent_at desc
      limit $4
    `,
    [unitId, session.propertyId, before || null, limit],
  );

  return Response.json({
    messages: result.rows.reverse().map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      direction: row.direction,
      body: row.body,
      providerStatus: row.provider_status,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
    })),
    hasMore: result.rows.length === limit,
  });
}
