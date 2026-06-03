import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query(
    `
      select
        pd.id,
        u.display_label as unit_label,
        pd.recipient_name,
        pd.package_type,
        pd.status,
        pd.delivered_at,
        pd.created_at
      from package_deliveries pd
      join residential_units u on u.id = pd.unit_id
      join properties p on p.id = pd.property_id
      where ($1::uuid is null or p.id = $1::uuid)
      order by pd.created_at desc
      limit 40
    `,
    [session.propertyId],
  );

  return Response.json({
    items: result.rows.map((row) => ({
      id: row.id,
      unitLabel: row.unit_label,
      recipientName: row.recipient_name,
      packageType: row.package_type,
      status: row.status,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    unitQuery?: string;
    recipientName?: string;
    packageType?: string;
    notes?: string;
  };

  const unitQuery = body.unitQuery?.trim();
  const recipientName = body.recipientName?.trim() || "Residente";
  const packageType = body.packageType?.trim() || "Paquete";
  const notes = body.notes?.trim() || null;

  if (!unitQuery) {
    return Response.json(
      { error: "La unidad del paquete es obligatoria" },
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
        u.is_active = true
        and ($1::uuid is null or p.id = $1::uuid)
        and (
          lower(u.display_label) like lower('%' || $2 || '%')
          or lower(u.tower || ' ' || u.unit_number) like lower('%' || $2 || '%')
          or lower(u.unit_number) = lower($2)
        )
      order by u.tower::int, u.unit_number
      limit 1
    `,
    [session.propertyId, unitQuery],
  );

  if ((unitResult.rowCount ?? 0) === 0) {
    return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  const unit = unitResult.rows[0];
  const packageResult = await db.query(
    `
      insert into package_deliveries (
        property_id,
        unit_id,
        recipient_name,
        package_type,
        status,
        received_by,
        notes
      )
      values ($1, $2, $3, $4, 'received', $5, $6)
      returning id, status, created_at
    `,
    [
      unit.property_id,
      unit.unit_id,
      recipientName,
      packageType,
      session.userId,
      notes,
    ],
  );

  await auditEvent({
    propertyId: unit.property_id,
    actorUserId: session.userId,
    action: "porter.package.create",
    entityType: "package_deliveries",
    entityId: packageResult.rows[0].id,
    metadata: {
      unitId: unit.unit_id,
      unitLabel: unit.display_label,
      status: packageResult.rows[0].status,
    },
  });

  return Response.json({
    package: {
      id: packageResult.rows[0].id,
      unitLabel: unit.display_label,
      recipientName,
      packageType,
      status: packageResult.rows[0].status,
      createdAt: packageResult.rows[0].created_at,
    },
    message: `Paquete registrado para ${unit.display_label}.`,
  });
}
