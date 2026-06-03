import { requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type PendingAuthorizationRow = {
  id: string;
  visitor_id: string;
  visitor_name: string;
  visitor_type: string;
  unit_label: string;
  status: string;
  created_at: string;
  notes: string | null;
  vehicle_plate: string | null;
  photo_url: string | null;
};

export async function GET(request: Request) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query<PendingAuthorizationRow>(
    `
      select
        aa.id,
        v.id as visitor_id,
        v.full_name as visitor_name,
        v.visitor_type,
        u.display_label as unit_label,
        aa.status,
        aa.created_at,
        aa.notes,
        v.vehicle_plate,
        v.photo_url
      from access_authorizations aa
      join visitors v on v.id = aa.visitor_id
      join residential_units u on u.id = aa.unit_id
      join properties p on p.id = u.property_id
      where
        aa.status = 'pending'
        and ($1::uuid is null or p.id = $1::uuid)
      order by aa.created_at desc
      limit 25
    `,
    [session.propertyId],
  );

  return Response.json({
    items: result.rows.map((row) => ({
      id: row.id,
      visitorId: row.visitor_id,
      visitorName: row.visitor_name,
      visitorType: row.visitor_type,
      unitLabel: row.unit_label,
      status: row.status,
      createdAt: row.created_at,
      notes: row.notes,
      vehiclePlate: row.vehicle_plate,
      photoUrl: row.photo_url,
    })),
  });
}
