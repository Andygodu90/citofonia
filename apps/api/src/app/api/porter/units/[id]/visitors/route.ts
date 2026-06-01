import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    fullName?: string;
    documentId?: string;
    phone?: string;
    visitorType?: string;
    reason?: string;
    notes?: string;
  };

  const fullName = body.fullName?.trim();
  const documentId = body.documentId?.trim() || null;
  const phone = body.phone?.trim() || null;
  const visitorType = body.visitorType?.trim() || "guest";
  const reason = body.reason?.trim() || "Visita";
  const notes = body.notes?.trim() || null;

  if (!fullName || fullName.length < 3) {
    return Response.json(
      { error: "El nombre del visitante es obligatorio" },
      { status: 400 },
    );
  }

  const unitResult = await db.query(
    `
      select
        u.id as unit_id,
        u.display_label,
        p.id as property_id
      from residential_units u
      join properties p on p.id = u.property_id
      where
        u.id = $1
        and u.is_active = true
        and ($2::uuid is null or p.id = $2::uuid)
      limit 1
    `,
    [id, session.propertyId],
  );

  if (unitResult.rowCount === 0) {
    return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  const unit = unitResult.rows[0];
  const client = await db.connect();

  try {
    await client.query("begin");

    const visitorResult = await client.query(
      `
        insert into visitors (
          property_id,
          full_name,
          document_id,
          phone,
          visitor_type,
          notes
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id, full_name, document_id, visitor_type, created_at
      `,
      [
        unit.property_id,
        fullName,
        documentId,
        phone,
        visitorType,
        notes ? `${reason}. ${notes}` : reason,
      ],
    );

    const visitor = visitorResult.rows[0];

    const authorizationResult = await client.query(
      `
        insert into access_authorizations (
          unit_id,
          visitor_id,
          authorization_type,
          status,
          notes
        )
        values ($1, $2, 'immediate_request', 'pending', $3)
        returning id, status, created_at
      `,
      [unit.unit_id, visitor.id, reason],
    );

    const authorization = authorizationResult.rows[0];

    const eventResult = await client.query(
      `
        insert into access_events (
          property_id,
          unit_id,
          visitor_id,
          authorization_id,
          registered_by,
          event_type,
          status,
          notes
        )
        values ($1, $2, $3, $4, $5, 'entry_request', 'pending', $6)
        returning id, occurred_at
      `,
      [
        unit.property_id,
        unit.unit_id,
        visitor.id,
        authorization.id,
        session.userId,
        reason,
      ],
    );

    const event = eventResult.rows[0];

    await client.query("commit");

    await auditEvent({
      propertyId: unit.property_id,
      actorUserId: session.userId,
      action: "porter.visitor.create",
      entityType: "visitors",
      entityId: visitor.id,
      metadata: {
        unitId: unit.unit_id,
        authorizationId: authorization.id,
        accessEventId: event.id,
        status: "pending",
      },
    });

    return Response.json({
      visitor: {
        id: visitor.id,
        fullName: visitor.full_name,
        documentId: visitor.document_id,
        visitorType: visitor.visitor_type,
        createdAt: visitor.created_at,
      },
      authorization: {
        id: authorization.id,
        status: authorization.status,
        createdAt: authorization.created_at,
      },
      accessEvent: {
        id: event.id,
        status: "pending",
        occurredAt: event.occurred_at,
      },
      message: `Visitante registrado para ${unit.display_label}. Autorizacion pendiente.`,
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
