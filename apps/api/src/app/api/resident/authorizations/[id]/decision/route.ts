import { auditEvent, requireResidentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await requireResidentSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    decision?: string;
    notes?: string;
  };
  const decision =
    body.decision === "approved"
      ? "approved"
      : body.decision === "rejected"
        ? "rejected"
        : null;

  if (!decision) {
    return Response.json(
      { error: "La decision debe ser approved o rejected" },
      { status: 400 },
    );
  }

  const client = await db.connect();

  try {
    await client.query("begin");

    const authResult = await client.query(
      `
        select
          aa.id,
          aa.status,
          aa.unit_id,
          aa.visitor_id,
          u.property_id,
          v.full_name as visitor_name
        from access_authorizations aa
        join residential_units u on u.id = aa.unit_id
        join residents r on r.unit_id = u.id
        join visitors v on v.id = aa.visitor_id
        where aa.id = $1 and r.id = $2
        limit 1
      `,
      [id, session.residentId],
    );

    if ((authResult.rowCount ?? 0) === 0) {
      await client.query("rollback");
      return Response.json({ error: "Autorizacion no encontrada" }, { status: 404 });
    }

    const authorization = authResult.rows[0];

    if (authorization.status !== "pending") {
      await client.query("rollback");
      return Response.json(
        { error: "La autorizacion ya fue gestionada" },
        { status: 409 },
      );
    }

    const note =
      body.notes?.trim() ||
      (decision === "approved"
        ? "Ingreso aprobado por residente"
        : "Ingreso rechazado por residente");

    await client.query(
      `
        update access_authorizations
        set
          status = $1,
          authorized_by_resident_id = $2,
          notes = coalesce(notes || '. ', '') || $3,
          updated_at = now()
        where id = $4
      `,
      [decision, session.residentId, note, id],
    );

    await client.query(
      `
        update access_events
        set status = $1,
            notes = coalesce(notes || '. ', '') || $2
        where authorization_id = $3
      `,
      [decision, note, id],
    );

    await client.query("commit");

    await auditEvent({
      propertyId: authorization.property_id,
      actorUserId: session.userId,
      action:
        decision === "approved"
          ? "resident.authorization.approve"
          : "resident.authorization.reject",
      entityType: "access_authorizations",
      entityId: authorization.id,
      metadata: {
        visitorId: authorization.visitor_id,
        unitId: authorization.unit_id,
        residentId: session.residentId,
        decision,
      },
    });

    return Response.json({
      authorization: {
        id: authorization.id,
        status: decision,
        visitorName: authorization.visitor_name,
      },
      message:
        decision === "approved"
          ? `Aprobaste el ingreso de ${authorization.visitor_name}.`
          : `Rechazaste el ingreso de ${authorization.visitor_name}.`,
    });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
