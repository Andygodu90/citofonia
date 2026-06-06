import { auditEvent, requirePorterSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getWhatsAppAuthorizationTemplate,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/lib/whatsapp";
import { notifyUsers } from "@/lib/notifications";

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
  const result = await db.query(
    `
      select
        wm.id,
        wt.id as thread_id,
        wm.direction,
        wm.body,
        wm.sent_at,
        wm.delivered_at,
        wm.read_at
      from whatsapp_threads wt
      join whatsapp_messages wm on wm.thread_id = wt.id
      join residential_units u on u.id = wt.unit_id
      join properties p on p.id = u.property_id
      where
        wt.unit_id = $1
        and ($2::uuid is null or p.id = $2::uuid)
      order by wm.sent_at desc
      limit 40
    `,
    [id, session.propertyId],
  );

  return Response.json({
    messages: result.rows.map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      direction: row.direction,
      body: row.body,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await requirePorterSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
    sendMode?: "text" | "template";
    templateName?: string;
    languageCode?: string;
  };

  const message = body.message?.trim() || "Mensaje de prueba desde porteria";
  const sendMode = body.sendMode === "template" ? "template" : "text";
  const defaultTemplate = getWhatsAppAuthorizationTemplate();

  const contactResult = await db.query(
    `
      select
        p.id as property_id,
        u.id as unit_id,
        c.id as contact_id,
        c.phone_e164
      from residential_units u
      join properties p on p.id = u.property_id
      join residents r on r.unit_id = u.id and r.is_active = true
      join resident_contacts c on c.resident_id = r.id and c.is_active = true and c.whatsapp_enabled = true
      where
        u.id = $1
        and u.is_active = true
        and ($2::uuid is null or p.id = $2::uuid)
      order by c.priority asc
      limit 1
    `,
    [id, session.propertyId],
  );

  if (contactResult.rowCount === 0) {
    return Response.json(
      { error: "No hay contacto habilitado para chat" },
      { status: 404 },
    );
  }

  const contact = contactResult.rows[0];
  const providerResult =
    sendMode === "template"
      ? await sendWhatsAppTemplate({
          to: contact.phone_e164,
          templateName: body.templateName?.trim() || defaultTemplate.name,
          languageCode: body.languageCode?.trim() || defaultTemplate.languageCode,
          bodyParameters: [message],
        })
      : await sendWhatsAppText({
          to: contact.phone_e164,
          body: message,
        });

  const existingThread = await db.query<{ id: string }>(
    `
      select id
      from whatsapp_threads
      where
        property_id = $1
        and unit_id = $2
        and contact_id = $3
        and status = 'open'
      order by updated_at desc
      limit 1
    `,
    [contact.property_id, contact.unit_id, contact.contact_id],
  );

  const threadResult = existingThread.rows[0]
    ? { rows: existingThread.rows }
    : await db.query(
    `
      insert into whatsapp_threads (property_id, unit_id, contact_id, status)
      values ($1, $2, $3, 'open')
      returning id
    `,
    [contact.property_id, contact.unit_id, contact.contact_id],
  );

  const messageResult = await db.query(
    `
      insert into whatsapp_messages (
        thread_id,
        direction,
        provider_message_id,
        message_type,
        provider_status,
        body,
        sent_by
      )
      values ($1, 'outbound', $2, $3, $4, $5, $6)
      returning id, sent_at
    `,
    [
      threadResult.rows[0].id,
      providerResult.providerMessageId,
      providerResult.messageType,
      providerResult.status,
      message,
      session.userId,
    ],
  );

  await db.query(
    "update whatsapp_threads set updated_at = now() where id = $1",
    [threadResult.rows[0].id],
  );

  await auditEvent({
    propertyId: contact.property_id,
    actorUserId: session.userId,
    action: "porter.message.create",
    entityType: "whatsapp_messages",
    entityId: messageResult.rows[0].id,
    metadata: {
      unitId: contact.unit_id,
      threadId: threadResult.rows[0].id,
      mode: providerResult.mode,
      messageType: providerResult.messageType,
      providerStatus: providerResult.status,
    },
  });

  const residentUsers = await db.query<{ id: string }>(
    `
      select au.id
      from app_users au
      join residents r on r.id = au.resident_id
      where
        au.is_active = true
        and r.unit_id = $1
    `,
    [contact.unit_id],
  );

  await notifyUsers({
    propertyId: contact.property_id,
    targetRoles: ["porter", "admin", "superadmin"],
    targetUserIds: residentUsers.rows.map((row) => row.id),
    title: "Nuevo mensaje",
    body: `Mensaje registrado para una unidad residencial.`,
    data: {
      type: "whatsapp_message",
      unitId: contact.unit_id,
      threadId: threadResult.rows[0].id,
      messageId: messageResult.rows[0].id,
    },
  });

  return Response.json({
    thread: {
      id: threadResult.rows[0].id,
      messageId: messageResult.rows[0].id,
      sentAt: messageResult.rows[0].sent_at,
      status: providerResult.status,
      mode: providerResult.mode,
      messageType: providerResult.messageType,
      message:
        providerResult.mode === "cloud"
          ? providerResult.messageType === "template"
            ? "Plantilla enviada por WhatsApp Cloud y guardada en historial."
            : "Mensaje enviado por WhatsApp Cloud y guardado en historial."
          : "Mensaje guardado en historial interno. Configura WhatsApp Cloud para envio real.",
    },
  });
}
