import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";

  const result = await db.query(
    `
      select
        u.id,
        u.tower as block,
        u.unit_number,
        u.display_label,
        u.is_active,
        count(distinct r.id)::int as residents,
        count(distinct c.id)::int as contacts
      from residential_units u
      left join residents r on r.unit_id = u.id
      left join resident_contacts c on c.resident_id = r.id
      where
        ($1::uuid is null or u.property_id = $1::uuid)
        and (
          $2 = ''
          or u.display_label ilike '%' || $2 || '%'
          or u.tower ilike '%' || $2 || '%'
          or u.unit_number ilike '%' || $2 || '%'
          or (u.tower || ' ' || u.unit_number) ilike '%' || $2 || '%'
        )
      group by u.id
      order by u.tower::int, u.unit_number
      limit 60
    `,
    [session.propertyId, query],
  );

  return Response.json({ units: result.rows });
}
