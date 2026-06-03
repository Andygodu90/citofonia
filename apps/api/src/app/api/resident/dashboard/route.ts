import { requireResidentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireResidentSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const residentResult = await db.query(
    `
      select
        r.id,
        r.full_name,
        r.document_id,
        r.email,
        u.id as unit_id,
        u.display_label,
        p.name as property_name
      from residents r
      join residential_units u on u.id = r.unit_id
      join properties p on p.id = u.property_id
      where r.id = $1 and r.is_active = true
      limit 1
    `,
    [session.residentId],
  );

  if ((residentResult.rowCount ?? 0) === 0) {
    return Response.json({ error: "Residente no encontrado" }, { status: 404 });
  }

  const resident = residentResult.rows[0];

  const pendingResult = await db.query(
    `
      select
        aa.id,
        v.full_name as visitor_name,
        v.visitor_type,
        v.vehicle_plate,
        v.photo_url,
        aa.status,
        aa.notes,
        aa.created_at
      from access_authorizations aa
      join visitors v on v.id = aa.visitor_id
      where aa.unit_id = $1 and aa.status = 'pending'
      order by aa.created_at desc
      limit 20
    `,
    [resident.unit_id],
  );

  const historyResult = await db.query(
    `
      select
        ae.id,
        ae.event_type,
        ae.status,
        ae.occurred_at,
        coalesce(v.full_name, 'Visitante') as visitor_name,
        v.vehicle_plate,
        v.photo_url
      from access_events ae
      left join visitors v on v.id = ae.visitor_id
      where ae.unit_id = $1
      order by ae.occurred_at desc
      limit 20
    `,
    [resident.unit_id],
  );

  return Response.json({
    resident: {
      id: resident.id,
      fullName: resident.full_name,
      documentId: resident.document_id,
      email: resident.email,
      unitId: resident.unit_id,
      unitLabel: resident.display_label,
      propertyName: resident.property_name,
    },
    pending: pendingResult.rows.map((row) => ({
      id: row.id,
      visitorName: row.visitor_name,
      visitorType: row.visitor_type,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      vehiclePlate: row.vehicle_plate,
      photoUrl: row.photo_url,
    })),
    history: historyResult.rows.map((row) => ({
      id: row.id,
      type: row.event_type,
      status: row.status,
      visitorName: row.visitor_name,
      occurredAt: row.occurred_at,
      vehiclePlate: row.vehicle_plate,
      photoUrl: row.photo_url,
    })),
  });
}
