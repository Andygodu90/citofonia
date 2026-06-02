import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type ReportRow = {
  id: string;
  report_type: string;
  title: string;
  unit_label: string | null;
  status: string;
  actor: string | null;
  occurred_at: string;
};

function toDateFilter(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

function escapeCsv(value: string | number | null) {
  const raw = value === null ? "" : String(value);

  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

function toCsv(rows: Array<Record<string, string | number | null>>) {
  const headers = [
    "tipo",
    "titulo",
    "unidad",
    "estado",
    "usuario",
    "fecha",
  ];
  const body = rows.map((row) =>
    [
      row.tipo,
      row.titulo,
      row.unidad,
      row.estado,
      row.usuario,
      row.fecha,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = toDateFilter(searchParams.get("from"), "1970-01-01");
  const to = toDateFilter(searchParams.get("to"), "2999-12-31");
  const status = searchParams.get("status")?.trim() ?? "";
  const unit = searchParams.get("unit")?.trim() ?? "";
  const format = searchParams.get("format")?.trim() ?? "json";

  const summary = await db.query(
    `
      select
        count(*) filter (where ae.event_type = 'entry_request')::int as visit_requests,
        count(*) filter (where aa.status = 'approved')::int as approved,
        count(*) filter (where aa.status = 'rejected')::int as rejected,
        count(*) filter (where aa.status = 'entered')::int as inside,
        count(*) filter (where ae.event_type = 'entry')::int as entries,
        count(*) filter (where ae.event_type = 'exit')::int as exits
      from access_events ae
      left join access_authorizations aa on aa.id = ae.authorization_id
      left join residential_units u on u.id = ae.unit_id
      where
        ($1::uuid is null or ae.property_id = $1::uuid)
        and ae.occurred_at >= $2::date
        and ae.occurred_at < ($3::date + interval '1 day')
        and ($4 = '' or ae.status = $4 or aa.status = $4)
        and ($5 = '' or u.display_label ilike '%' || $5 || '%')
    `,
    [session.propertyId, from, to, status, unit],
  );

  const communications = await db.query(
    `
      select
        count(*)::int as calls,
        count(*) filter (where status = 'answered')::int as answered,
        count(*) filter (where status in ('missed', 'no_answer'))::int as missed
      from call_logs cl
      left join residential_units u on u.id = cl.unit_id
      where
        ($1::uuid is null or cl.property_id = $1::uuid)
        and cl.started_at >= $2::date
        and cl.started_at < ($3::date + interval '1 day')
        and ($4 = '' or cl.status = $4)
        and ($5 = '' or u.display_label ilike '%' || $5 || '%')
    `,
    [session.propertyId, from, to, status, unit],
  );

  const rows = await db.query<ReportRow>(
    `
      select *
      from (
        select
          ae.id,
          ae.event_type as report_type,
          coalesce(v.full_name, 'Movimiento de acceso') as title,
          u.display_label as unit_label,
          ae.status,
          au.username as actor,
          ae.occurred_at
        from access_events ae
        left join visitors v on v.id = ae.visitor_id
        left join residential_units u on u.id = ae.unit_id
        left join app_users au on au.id = ae.registered_by
        where
          ($1::uuid is null or ae.property_id = $1::uuid)
          and ae.occurred_at >= $2::date
          and ae.occurred_at < ($3::date + interval '1 day')
          and ($4 = '' or ae.status = $4)
          and ($5 = '' or u.display_label ilike '%' || $5 || '%')

        union all

        select
          cl.id,
          'call' as report_type,
          'Llamada protegida' as title,
          u.display_label as unit_label,
          cl.status,
          au.username as actor,
          cl.started_at as occurred_at
        from call_logs cl
        left join residential_units u on u.id = cl.unit_id
        left join app_users au on au.id = cl.initiated_by
        where
          ($1::uuid is null or cl.property_id = $1::uuid)
          and cl.started_at >= $2::date
          and cl.started_at < ($3::date + interval '1 day')
          and ($4 = '' or cl.status = $4)
          and ($5 = '' or u.display_label ilike '%' || $5 || '%')
      ) activity
      order by occurred_at desc
      limit ${format === "csv" ? 1000 : 80}
    `,
    [session.propertyId, from, to, status, unit],
  );

  if (format === "csv") {
    const csv = toCsv(
      rows.rows.map((row) => ({
        tipo: row.report_type,
        titulo: row.title,
        unidad: row.unit_label,
        estado: row.status,
        usuario: row.actor,
        fecha: row.occurred_at,
      })),
    );

    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="reporte-porteria-${from}-a-${to}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return Response.json({
    filters: { from, to, status, unit },
    summary: {
      ...summary.rows[0],
      ...communications.rows[0],
    },
    rows: rows.rows.map((row) => ({
      id: row.id,
      type: row.report_type,
      title: row.title,
      unitLabel: row.unit_label,
      status: row.status,
      actor: row.actor,
      occurredAt: row.occurred_at,
    })),
  });
}
