import { requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const unitResult = await db.query(
    `
      select
        u.id,
        p.id as property_id,
        p.name as property_name,
        u.tower as block,
        u.unit_number,
        u.display_label,
        u.is_access_blocked,
        u.access_block_reason,
        u.car_plate,
        u.motorcycle_plate,
        count(r.id)::int as active_residents
      from residential_units u
      join properties p on p.id = u.property_id
      left join residents r on r.unit_id = u.id and r.is_active = true
      where
        u.id = $1
        and u.is_active = true
        and ($2::uuid is null or p.id = $2::uuid)
      group by u.id, p.id
      limit 1
    `,
    [id, session.propertyId],
  );

  if (unitResult.rowCount === 0) {
    return Response.json({ error: "Unidad no encontrada" }, { status: 404 });
  }

  const contactResult = await db.query(
    `
      select
        count(c.id)::int as enabled_contacts,
        bool_or(c.call_enabled) as can_call,
        bool_or(c.whatsapp_enabled) as can_chat,
        string_agg(
          case when r.show_name_to_porter then r.full_name else null end,
          ', '
        ) as visible_names,
        string_agg(
          case when r.show_phone_to_porter then c.phone_e164 else null end,
          ', '
        ) as visible_phones
      from residents r
      left join resident_contacts c on c.resident_id = r.id and c.is_active = true
      where r.unit_id = $1 and r.is_active = true
    `,
    [id],
  );

  const unit = unitResult.rows[0];
  const contact = contactResult.rows[0];

  return Response.json({
    unit: {
      id: unit.id,
      propertyId: unit.property_id,
      propertyName: unit.property_name,
      block: unit.block,
      unitNumber: unit.unit_number,
      displayLabel: unit.display_label,
      activeResidents: unit.active_residents,
      isAccessBlocked: unit.is_access_blocked,
      accessBlockReason: unit.access_block_reason,
      carPlate: unit.car_plate,
      motorcyclePlate: unit.motorcycle_plate,
      enabledContacts: contact.enabled_contacts,
      canCall: Boolean(contact.can_call),
      canChat: Boolean(contact.can_chat),
      visibleResidentNames: contact.visible_names,
      visibleResidentPhones: contact.visible_phones,
      protectedSummary: "Gestion operativa de la unidad seleccionada",
      privacyNotice:
        contact.visible_names || contact.visible_phones
          ? "La administracion habilito algunos datos para esta unidad."
          : "Los nombres y telefonos estan protegidos para el usuario de porteria.",
    },
  });
}
