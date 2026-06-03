import { requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type HistoryRow = {
  id: string;
  type: "visitor" | "call" | "message" | "entry" | "exit";
  title: string;
  subtitle: string;
  status: string;
  direction?: "inbound" | "outbound";
  read_at?: string | null;
  occurred_at: string;
};

export async function GET(request: Request) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query<HistoryRow>(
    `
      select *
      from (
        select
          ae.id,
          'visitor' as type,
          v.full_name as title,
          u.display_label || ' - ' || coalesce(v.visitor_type, 'visitante') as subtitle,
          ae.status,
          null::text as direction,
          null::timestamptz as read_at,
          ae.occurred_at
        from access_events ae
        join residential_units u on u.id = ae.unit_id
        join visitors v on v.id = ae.visitor_id
        where
          ae.event_type = 'entry_request'
          and ($1::uuid is null or ae.property_id = $1::uuid)

        union all

        select
          ae.id,
          ae.event_type as type,
          case
            when ae.event_type = 'entry' then 'Entrada registrada'
            else 'Salida registrada'
          end as title,
          u.display_label || ' - ' || v.full_name as subtitle,
          ae.status,
          null::text as direction,
          null::timestamptz as read_at,
          ae.occurred_at
        from access_events ae
        join residential_units u on u.id = ae.unit_id
        join visitors v on v.id = ae.visitor_id
        where
          ae.event_type in ('entry', 'exit')
          and ($1::uuid is null or ae.property_id = $1::uuid)

        union all

        select
          cl.id,
          'call' as type,
          'Llamada registrada' as title,
          u.display_label as subtitle,
          cl.status,
          null::text as direction,
          null::timestamptz as read_at,
          cl.started_at as occurred_at
        from call_logs cl
        join residential_units u on u.id = cl.unit_id
        where ($1::uuid is null or cl.property_id = $1::uuid)

        union all

        select
          wm.id,
          'message' as type,
          left(wm.body, 60) as title,
          u.display_label as subtitle,
          wm.provider_status as status,
          wm.direction,
          wm.read_at,
          wm.sent_at as occurred_at
        from whatsapp_messages wm
        join whatsapp_threads wt on wt.id = wm.thread_id
        join residential_units u on u.id = wt.unit_id
        where ($1::uuid is null or wt.property_id = $1::uuid)
      ) history
      order by occurred_at desc
      limit 25
    `,
    [session.propertyId],
  );

  return Response.json({
    items: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      subtitle: row.subtitle,
      status: row.status,
      direction: row.direction,
      readAt: row.read_at,
      occurredAt: row.occurred_at,
    })),
  });
}
