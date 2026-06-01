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
  const client = await db.connect();

  try {
    await client.query("begin");

    const authorizationResult = await client.query(
      `
        select
          aa.id,
          aa.status,
          aa.unit_id,
          aa.visitor_id,
          u.display_label,
          p.id as property_id,
          v.full_name as visitor_name
        from access_authorizations aa
        join residential_units u on u.id = aa.unit_id
        join properties p on p.id = u.property_id
        join visitors v on v.id = aa.visitor_id
        where
          aa.id = $1
          and ($2::uuid is null or p.id = $2::uuid)
        limit 1
      `,
      [id, session.propertyId],
    );

    if ((authorizationResult.rowCount ?? 0) === 0) {
      await client.query("rollback");
      return Response.json({ error: "Autorizacion no encontrada" }, { status: 404 });
    }

    const authorization = authorizationResult.rows[0];

    if (authorization.status !== "approved") {
      await client.query("rollback");
      return Response.json(
        { error: "Solo se puede registrar entrada de autorizaciones aprobadas" },
        { status: 409 },
      );
    }

    const existingEntry = await client.query(
      "select id from access_events where authorization_id = $1 and event_type = 'entry' limit 1",
      [id],
    );

    if ((existingEntry.rowCount ?? 0) > 0) {
      await client.query("rollback");
      return Response.json({ error: "La entrada ya fue registrada" }, { status: 409 });
    }

    await client.query(
      "update access_authorizations set status = 'entered', updated_at = now() where id = $1",
      [id],
    );

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
        values ($1, $2, $3, $4, $5, 'entry', 'entered', 'Entrada registrada por porteria')
        returning id, occurred_at
      `,
      [
        authorization.property_id,
        authorization.unit_id,
        authorization.visitor_id,
        authorization.id,
        session.userId,
      ],
    );

    await client.query("commit");

    await auditEvent({
      propertyId: authorization.property_id,
      actorUserId: session.userId,
      action: "porter.movement.entry",
      entityType: "access_authorizations",
      entityId: authorization.id,
      metadata: {
        accessEventId: eventResult.rows[0].id,
        visitorId: authorization.visitor_id,
        unitId: authorization.unit_id,
      },
    });

    return Response.json({
      movement: {
        authorizationId: authorization.id,
        status: "entered",
        occurredAt: eventResult.rows[0].occurred_at,
      },
      message: `Entrada registrada para ${authorization.visitor_name}.`,
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
