import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

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

function escapeCsv(value: string | number | boolean | null) {
  const raw = value === null ? "" : String(value);

  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

type ExportRow = Record<string, string | number | boolean | null>;

function getHeaders(rows: ExportRow[]) {
  return rows[0] ? Object.keys(rows[0]) : ["sin_datos"];
}

function toCsv(rows: ExportRow[]) {
  const headers = getHeaders(rows);
  const body = rows.map((row) =>
    headers
      .map((header) => row[header] ?? "")
      .map(escapeCsv)
      .join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

function toXlsx(rows: ExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ sin_datos: "" }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

async function toPdf(title: string, rows: ExportRow[]) {
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(16).text(title, { align: "left" });
  doc.moveDown();

  if (rows.length === 0) {
    doc.fontSize(11).text("No hay datos para este reporte.");
  } else {
    const headers = getHeaders(rows).slice(0, 6);

    rows.slice(0, 120).forEach((row, index) => {
      doc.fontSize(10).text(`${index + 1}. ${headers.map((header) => `${header}: ${row[header] ?? ""}`).join(" | ")}`);
      doc.moveDown(0.35);
    });
  }

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function toBinaryBody(buffer: Buffer) {
  return new Uint8Array(buffer);
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
  const kind = searchParams.get("kind")?.trim() ?? "activity";
  const format = searchParams.get("format")?.trim() ?? "json";

  if (kind === "units" || kind === "blocked_units") {
    const unitRows = await db.query(
      `
        select
          u.display_label as unidad,
          u.tower as bloque,
          u.unit_number as apartamento,
          u.is_active as activa,
          u.is_access_blocked as bloqueada,
          u.access_block_reason as motivo_bloqueo,
          u.car_plate as placa_carro,
          u.motorcycle_plate as placa_moto,
          count(distinct r.id)::int as residentes,
          coalesce(string_agg(distinct r.full_name, ', '), '') as nombres_residentes
        from residential_units u
        left join residents r on r.unit_id = u.id
        where
          ($1::uuid is null or u.property_id = $1::uuid)
          and ($2 = '' or u.display_label ilike '%' || $2 || '%')
          and ($3 = 'units' or u.is_access_blocked = true)
        group by u.id
        order by u.tower::int, u.unit_number
      `,
      [session.propertyId, unit, kind],
    );

    const exportRows = unitRows.rows as ExportRow[];
    const filename =
      kind === "blocked_units" ? "unidades-bloqueadas" : "unidades";

    if (format === "csv") {
      return new Response(toCsv(exportRows), {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    if (format === "xlsx") {
      return new Response(toBinaryBody(toXlsx(exportRows)), {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    if (format === "pdf") {
      return new Response(toBinaryBody(await toPdf(filename, exportRows)), {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
          "Content-Type": "application/pdf",
        },
      });
    }

    return Response.json({ kind, rows: unitRows.rows });
  }

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

  const exportRows = rows.rows.map((row) => ({
        tipo: row.report_type,
        titulo: row.title,
        unidad: row.unit_label,
        estado: row.status,
        usuario: row.actor,
        fecha: row.occurred_at,
      }));

  if (format === "csv") {
    return new Response(toCsv(exportRows), {
      headers: {
        "Content-Disposition": `attachment; filename="reporte-porteria-${from}-a-${to}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  if (format === "xlsx") {
    return new Response(toBinaryBody(toXlsx(exportRows)), {
      headers: {
        "Content-Disposition": `attachment; filename="reporte-porteria-${from}-a-${to}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  }

  if (format === "pdf") {
    return new Response(toBinaryBody(await toPdf("Reporte de porteria", exportRows)), {
      headers: {
        "Content-Disposition": `attachment; filename="reporte-porteria-${from}-a-${to}.pdf"`,
        "Content-Type": "application/pdf",
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
