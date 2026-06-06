import { auditEvent, requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

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
    fullName?: string;
    documentId?: string | null;
    email?: string | null;
    isActive?: boolean;
    phone?: string | null;
    showNameToPorter?: boolean;
    showPhoneToPorter?: boolean;
  };

  if (
    body.fullName === undefined &&
    body.documentId === undefined &&
    body.email === undefined &&
    body.isActive === undefined &&
    body.phone === undefined &&
    body.showNameToPorter === undefined &&
    body.showPhoneToPorter === undefined
  ) {
    return Response.json({ error: "No hay cambios para aplicar" }, { status: 400 });
  }

  const client = await db.connect();

  try {
    await client.query("begin");

    const result = await client.query(
      `
        update residents r
        set
          full_name = coalesce(nullif($1, ''), r.full_name),
          document_id = case when $2::text is null then r.document_id else nullif($2, '') end,
          email = case when $3::text is null then r.email else nullif($3, '') end,
          is_active = coalesce($4, r.is_active),
          show_name_to_porter = coalesce($7, r.show_name_to_porter),
          show_phone_to_porter = coalesce($8, r.show_phone_to_porter),
          updated_at = now()
        from residential_units u
        where
          r.id = $5
          and u.id = r.unit_id
          and ($6::uuid is null or u.property_id = $6::uuid)
        returning
          r.id,
          r.full_name,
          r.document_id,
          r.email,
          r.is_active,
          r.show_name_to_porter,
          r.show_phone_to_porter
      `,
      [
        body.fullName?.trim() ?? null,
        body.documentId === undefined ? null : body.documentId?.trim() ?? "",
        body.email === undefined ? null : body.email?.trim() ?? "",
        body.isActive ?? null,
        id,
        session.propertyId,
        body.showNameToPorter ?? null,
        body.showPhoneToPorter ?? null,
      ],
    );

    if ((result.rowCount ?? 0) === 0) {
      await client.query("rollback");
      return Response.json({ error: "Residente no encontrado" }, { status: 404 });
    }

    if (body.phone !== undefined) {
      const phone = body.phone?.trim() ?? "";
      const existingContact = await client.query(
        `
          select id
          from resident_contacts
          where resident_id = $1 and contact_type = 'primary'
          limit 1
        `,
        [id],
      );

      if ((existingContact.rowCount ?? 0) > 0) {
        await client.query(
          `
            update resident_contacts
            set
              phone_e164 = nullif($2, ''),
              is_active = $2 <> '',
              updated_at = now()
            where id = $1
          `,
          [existingContact.rows[0].id, phone],
        );
      } else if (phone) {
        await client.query(
          `
            insert into resident_contacts (
              resident_id,
              contact_type,
              phone_e164,
              priority
            )
            values ($1, 'primary', $2, 1)
          `,
          [id, phone],
        );
      }
    }

    await client.query("commit");

    await auditEvent({
      propertyId: session.propertyId,
      actorUserId: session.userId,
      action:
        typeof body.isActive === "boolean"
          ? body.isActive
            ? "admin.resident.activate"
            : "admin.resident.deactivate"
          : "admin.resident.update",
      entityType: "residents",
      entityId: id,
      metadata: {
        isActive: body.isActive,
        changedName: body.fullName !== undefined,
        changedDocument: body.documentId !== undefined,
        changedEmail: body.email !== undefined,
        changedPhone: body.phone !== undefined,
        showNameToPorter: body.showNameToPorter,
        showPhoneToPorter: body.showPhoneToPorter,
      },
    });

    return Response.json({ resident: result.rows[0] });
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
