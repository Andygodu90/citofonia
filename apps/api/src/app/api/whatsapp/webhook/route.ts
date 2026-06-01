import { db } from "@/lib/db";

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

  let saved = 0;

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

    await db.query(
      `
        insert into whatsapp_messages (thread_id, direction, provider_message_id, body, sent_at)
        values ($1, 'inbound', $2, $3, to_timestamp($4::bigint))
      `,
      [
        threadResult.rows[0].id,
        message.id ?? null,
        body,
        Number(message.timestamp ?? Math.floor(Date.now() / 1000)),
      ],
    );

    saved += 1;
  }

  return Response.json({ received: messages.length, saved });
}
