import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 50);

  const result = await db.query(
    `
      select
        u.id as unit_id,
        u.display_label as unit_label,
        coalesce(min(r.full_name), 'Residente sin registrar') as resident_name,
        coalesce(min(c.phone_e164), '') as phone,
        lm.id as last_message_id,
        lm.body as last_message,
        lm.direction as last_direction,
        lm.sent_at as last_at,
        exists (
          select 1
          from whatsapp_threads wt
          where wt.unit_id = u.id
        ) as has_thread
      from residential_units u
      left join residents r on r.unit_id = u.id and r.is_active = true
      left join resident_contacts c on c.resident_id = r.id and c.is_active = true
      left join lateral (
        select
          wm.id,
          wm.body,
          wm.direction,
          wm.sent_at
        from whatsapp_threads wt
        join whatsapp_messages wm on wm.thread_id = wt.id
        where wt.unit_id = u.id
        order by wm.sent_at desc
        limit 1
      ) lm on true
      where
        ($1::uuid is null or u.property_id = $1::uuid)
        and u.is_active = true
      group by u.id, lm.id, lm.body, lm.direction, lm.sent_at
      order by lm.sent_at desc nulls last, u.tower::int, u.unit_number
      limit $2
    `,
    [session.propertyId, limit],
  );

  return Response.json({
    chats: result.rows.map((row) => ({
      unitId: row.unit_id,
      unitLabel: row.unit_label,
      residentName: row.resident_name,
      phone: row.phone,
      lastMessageId: row.last_message_id,
      lastMessage: row.last_message ?? "Sin mensajes registrados",
      lastDirection: row.last_direction,
      lastAt: row.last_at,
      hasThread: row.has_thread,
      unreadCount: 0,
    })),
  });
}
