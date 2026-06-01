import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query(
    `
      select
        (select count(*)::int from residential_units u where $1::uuid is null or u.property_id = $1::uuid) as units,
        (
          select count(*)::int
          from residents r
          join residential_units u on u.id = r.unit_id
          where $1::uuid is null or u.property_id = $1::uuid
        ) as residents,
        (select count(*)::int from app_users au where $1::uuid is null or au.property_id = $1::uuid) as users,
        (select count(*)::int from visitors v where $1::uuid is null or v.property_id = $1::uuid) as visitors,
        (select count(*)::int from access_authorizations aa join residential_units u on u.id = aa.unit_id where aa.status = 'pending' and ($1::uuid is null or u.property_id = $1::uuid)) as pending,
        (select count(*)::int from access_authorizations aa join residential_units u on u.id = aa.unit_id where aa.status = 'entered' and ($1::uuid is null or u.property_id = $1::uuid)) as inside
    `,
    [session.propertyId],
  );

  return Response.json({ summary: result.rows[0] });
}
