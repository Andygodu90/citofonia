import { auditEvent, requireResidentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireResidentSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    fullName?: string;
    documentId?: string;
    phone?: string;
    visitorType?: string;
    notes?: string;
  };

  const fullName = body.fullName?.trim();

  if (!fullName || fullName.length < 3) {
    return Response.json(
      { error: "El nombre del visitante es obligatorio" },
      { status: 400 },
    );
  }

  const residentResult = await db.query(
    `
      select
        r.id as resident_id,
        u.id as unit_id,
        u.property_id
      from residents r
      join residential_units u on u.id = r.unit_id
      where r.id = $1 and r.is_active = true
      limit 1
    `,
    [session.residentId],
  );

  if ((residentResult.rowCount ?? 0) === 0) {
    return Response.json({ error: "Residente no encontrado" }, { status: 404 });
  }

  const resident = residentResult.rows[0];
  const client = await db.connect();

  try {
    await client.query("begin");

    const visitorResult = await client.query(
      `
        insert into visitors (property_id, full_name, document_id, phone, visitor_type, notes)
        values ($1, $2, $3, $4, $5, $6)
        returning id, full_name, visitor_type, created_at
      `,
      [
        resident.property_id,
        fullName,
        body.documentId?.trim() || null,
        body.phone?.trim() || null,
        body.visitorType?.trim() || "guest",
        body.notes?.trim() || "Creado por residente",
      ],
    );

    const visitor = visitorResult.rows[0];

    const authorizationResult = await client.query(
      `
        insert into access_authorizations (
          unit_id,
          visitor_id,
          authorized_by_resident_id,
          authorization_type,
          status,
          valid_from,
          notes
        )
        values ($1, $2, $3, 'resident_preapproved', 'approved', now(), $4)
        returning id, status, created_at
      `,
      [resident.unit_id, visitor.id, session.residentId, "Visitante creado por residente"],
    );

    await client.query("commit");

    await auditEvent({
      propertyId: resident.property_id,
      actorUserId: session.userId,
      action: "resident.visitor.preapprove",
      entityType: "access_authorizations",
      entityId: authorizationResult.rows[0].id,
      metadata: {
        visitorId: visitor.id,
        unitId: resident.unit_id,
        residentId: session.residentId,
      },
    });

    return Response.json({
      visitor: {
        id: visitor.id,
        fullName: visitor.full_name,
        visitorType: visitor.visitor_type,
        createdAt: visitor.created_at,
      },
      authorization: authorizationResult.rows[0],
      message: "Visitante autorizado previamente para tu unidad.",
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
