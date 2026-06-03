import { NextRequest } from "next/server";
import { requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";

  const result = await db.query(
    `
      select
        u.id,
        p.name as property_name,
        u.tower as block,
        u.unit_number,
        u.display_label,
        count(r.id)::int as active_residents
      from residential_units u
      join properties p on p.id = u.property_id
      left join residents r on r.unit_id = u.id and r.is_active = true
      where
        p.name = $1
        and ($3::uuid is null or p.id = $3::uuid)
        and u.is_active = true
        and (
          $2 = ''
          or u.display_label ilike '%' || $2 || '%'
          or u.tower ilike '%' || $2 || '%'
          or u.unit_number ilike '%' || $2 || '%'
          or (u.tower || ' ' || u.unit_number) ilike '%' || $2 || '%'
          or (u.tower || '-' || u.unit_number) ilike '%' || $2 || '%'
        )
      group by u.id, p.name
      order by u.tower::int, u.unit_number
      limit 350
    `,
    ["Conjunto Residencial Arcadas de San Isidro", query, session.propertyId],
  );

  return Response.json({
    units: result.rows.map((row) => ({
      id: row.id,
      propertyName: row.property_name,
      block: row.block,
      unitNumber: row.unit_number,
      displayLabel: row.display_label,
      activeResidents: row.active_residents,
      privacyLabel:
        row.active_residents === 1
          ? "1 residente activo - datos protegidos"
          : `${row.active_residents} residentes activos - datos protegidos`,
    })),
  });
}
