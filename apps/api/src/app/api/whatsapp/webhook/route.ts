import { db } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

export const runtime = "nodejs";

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          text?: {
            body?: string;
          };
          timestamp?: string;
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
        }>;
      };
    }>;
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return Response.json({ error: "Webhook no verificado" }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as WhatsAppWebhookPayload;
  const messages =
    payload.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.messages ?? []) ?? [],
    ) ?? [];
  const statuses =
    payload.entry?.flatMap((entry) =>
      entry.changes?.flatMap((change) => change.value?.statuses ?? []) ?? [],
    ) ?? [];

  let saved = 0;
  let updated = 0;

  for (const message of messages) {
    const from = message.from;
    const body = message.text?.body?.trim();

    if (!from || !body) {
      continue;
    }

    const contactResult = await db.query(
      `
        select
          c.id as contact_id,
          u.id as unit_id,
          u.property_id
        from resident_contacts c
        join residents r on r.id = c.resident_id
        join residential_units u on u.id = r.unit_id
        where
          replace(c.phone_e164, '+', '') = $1
          and c.is_active = true
          and c.whatsapp_enabled = true
        order by c.priority asc
        limit 1
      `,
      [from],
    );

    if ((contactResult.rowCount ?? 0) === 0) {
      continue;
    }

    const contact = contactResult.rows[0];
    const threadResult = await db.query(
      `
        insert into whatsapp_threads (property_id, unit_id, contact_id, status)
        values ($1, $2, $3, 'open')
        returning id
      `,
      [contact.property_id, contact.unit_id, contact.contact_id],
    );

    const messageResult = await db.query(
      `
        insert into whatsapp_messages (thread_id, direction, provider_message_id, body, sent_at)
        values ($1, 'inbound', $2, $3, to_timestamp($4::bigint))
        returning id
      `,
      [
        threadResult.rows[0].id,
        message.id ?? null,
        body,
        Number(message.timestamp ?? Math.floor(Date.now() / 1000)),
      ],
    );

    await notifyUsers({
      propertyId: contact.property_id,
      targetRoles: ["porter", "admin", "superadmin"],
      title: "Respuesta de residente",
      body: "Llego un mensaje nuevo por WhatsApp.",
      data: {
        type: "whatsapp_inbound",
        unitId: contact.unit_id,
        threadId: threadResult.rows[0].id,
        messageId: messageResult.rows[0].id,
      },
    });

    saved += 1;
  }

  for (const status of statuses) {
    if (!status.id || !status.status) {
      continue;
    }

    const timestamp = Number(status.timestamp ?? Math.floor(Date.now() / 1000));

    const result = await db.query(
      `
        update whatsapp_messages
        set
          provider_status = $1,
          delivered_at = case
            when $1 in ('delivered', 'read') and delivered_at is null
            then to_timestamp($2::bigint)
            else delivered_at
          end,
          read_at = case
            when $1 = 'read'
            then to_timestamp($2::bigint)
            else read_at
          end
        where provider_message_id = $3
      `,
      [status.status, timestamp, status.id],
    );

    updated += result.rowCount ?? 0;
  }

  return Response.json({
    received: messages.length,
    saved,
    statuses: statuses.length,
    updated,
  });
}
