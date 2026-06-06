import { auditEvent, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdminSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    isActive?: boolean;
    isAccessBlocked?: boolean;
    accessBlockReason?: string | null;
    carPlate?: string | null;
    motorcyclePlate?: string | null;
  };

  if (
    typeof body.isActive !== "boolean" &&
    typeof body.isAccessBlocked !== "boolean" &&
    body.accessBlockReason === undefined &&
    body.carPlate === undefined &&
    body.motorcyclePlate === undefined
  ) {
    return Response.json({ error: "No hay cambios para aplicar" }, { status: 400 });
  }

  const result = await db.query(
    `
      update residential_units
      set
        is_active = coalesce($1, is_active),
        is_access_blocked = coalesce($2, is_access_blocked),
        access_block_reason = case
          when $3::text is null then access_block_reason
          else nullif($3, '')
        end,
        car_plate = case
          when $4::text is null then car_plate
          else nullif(upper($4), '')
        end,
        motorcycle_plate = case
          when $5::text is null then motorcycle_plate
          else nullif(upper($5), '')
        end,
        access_blocked_at = case
          when $2::boolean = true and is_access_blocked = false then now()
          else access_blocked_at
        end,
        access_blocked_by = case
          when $2::boolean = true and is_access_blocked = false then $8::uuid
          else access_blocked_by
        end,
        access_unblocked_at = case
          when $2::boolean = false and is_access_blocked = true then now()
          else access_unblocked_at
        end,
        access_unblocked_by = case
          when $2::boolean = false and is_access_blocked = true then $8::uuid
          else access_unblocked_by
        end,
        updated_at = now()
      where id = $6 and ($7::uuid is null or property_id = $7::uuid)
      returning
        id,
        display_label,
        is_active,
        is_access_blocked,
        access_block_reason,
        car_plate,
        motorcycle_plate
    `,
    [
      body.isActive ?? null,
      body.isAccessBlocked ?? null,
      body.accessBlockReason === undefined
        ? null
        : body.accessBlockReason?.trim() ?? "",
      body.carPlate === undefined ? null : body.carPlate?.trim() ?? "",
      body.motorcyclePlate === undefined
        ? null
        : body.motorcyclePlate?.trim() ?? "",
      id,
      session.propertyId,
      session.userId,
    ],
  );

  if ((result.rowCount ?? 0) === 0) {
    return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  await auditEvent({
    propertyId: session.propertyId,
    actorUserId: session.userId,
    action:
      typeof body.isAccessBlocked === "boolean"
        ? body.isAccessBlocked
          ? "admin.unit.block"
          : "admin.unit.unblock"
        : typeof body.isActive === "boolean"
          ? body.isActive
            ? "admin.unit.activate"
            : "admin.unit.deactivate"
          : "admin.unit.update",
    entityType: "residential_units",
    entityId: id,
    metadata: {
      isActive: body.isActive,
      isAccessBlocked: body.isAccessBlocked,
      changedVehicles:
        body.carPlate !== undefined || body.motorcyclePlate !== undefined,
    },
  });

  if (typeof body.isAccessBlocked === "boolean") {
    await notifyUsers({
      propertyId: session.propertyId,
      targetRoles: ["porter"],
      title: body.isAccessBlocked
        ? "Unidad bloqueada"
        : "Bloqueo levantado",
      body: `${result.rows[0].display_label}: ${
        body.isAccessBlocked
          ? "no permitir domicilios ni vehiculos."
          : "la unidad queda habilitada nuevamente."
      }`,
      data: {
        type: "unit_block",
        unitId: id,
        blocked: body.isAccessBlocked,
      },
    });
  }

  return Response.json({ unit: result.rows[0] });
}
