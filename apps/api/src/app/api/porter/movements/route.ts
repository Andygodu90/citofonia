import { requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const pendingEntry = await db.query(
    `
      select
        aa.id as authorization_id,
        v.full_name as visitor_name,
        v.visitor_type,
        u.display_label as unit_label,
        aa.status,
        aa.updated_at
      from access_authorizations aa
      join visitors v on v.id = aa.visitor_id
      join residential_units u on u.id = aa.unit_id
      join properties p on p.id = u.property_id
      where
        aa.status = 'approved'
        and ($1::uuid is null or p.id = $1::uuid)
        and not exists (
          select 1
          from access_events ae
          where ae.authorization_id = aa.id and ae.event_type = 'entry'
        )
      order by aa.updated_at desc
      limit 25
    `,
    [session.propertyId],
  );

  const pendingExit = await db.query(
    `
      select
        aa.id as authorization_id,
        v.full_name as visitor_name,
        v.visitor_type,
        u.display_label as unit_label,
        entry.occurred_at as entered_at
      from access_authorizations aa
      join visitors v on v.id = aa.visitor_id
      join residential_units u on u.id = aa.unit_id
      join properties p on p.id = u.property_id
      join access_events entry
        on entry.authorization_id = aa.id
        and entry.event_type = 'entry'
      where
        aa.status = 'entered'
        and ($1::uuid is null or p.id = $1::uuid)
        and not exists (
          select 1
          from access_events exit
          where exit.authorization_id = aa.id and exit.event_type = 'exit'
        )
      order by entry.occurred_at desc
      limit 25
    `,
    [session.propertyId],
  );

  return Response.json({
    pendingEntry: pendingEntry.rows.map((row) => ({
      authorizationId: row.authorization_id,
      visitorName: row.visitor_name,
      visitorType: row.visitor_type,
      unitLabel: row.unit_label,
      status: row.status,
      updatedAt: row.updated_at,
    })),
    pendingExit: pendingExit.rows.map((row) => ({
      authorizationId: row.authorization_id,
      visitorName: row.visitor_name,
      visitorType: row.visitor_type,
      unitLabel: row.unit_label,
      enteredAt: row.entered_at,
    })),
  });
}
