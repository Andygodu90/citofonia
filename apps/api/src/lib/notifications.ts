import { db } from "@/lib/db";

type NotificationPayload = {
  propertyId?: string | null;
  targetRoles?: string[];
  targetUserIds?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

async function sendExpoPushMessages(messages: Array<Record<string, unknown>>) {
  if (messages.length === 0) {
    return;
  }

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  }).catch(() => {
    // La notificacion queda registrada aunque Expo no este disponible.
  });
}

export async function notifyUsers(input: NotificationPayload) {
  const targetRoles = unique(input.targetRoles ?? []);
  const targetUserIds = unique(input.targetUserIds ?? []);

  if (targetRoles.length === 0 && targetUserIds.length === 0) {
    return;
  }

  const eventRows: Array<{
    target_role: string | null;
    target_user_id: string | null;
  }> = [
    ...targetRoles.map((role) => ({
      target_role: role,
      target_user_id: null,
    })),
    ...targetUserIds.map((userId) => ({
      target_role: null,
      target_user_id: userId,
    })),
  ];

  for (const event of eventRows) {
    await db.query(
      `
        insert into notification_events (
          property_id,
          target_role,
          target_user_id,
          title,
          body,
          data,
          delivery_status
        )
        values ($1, $2, $3, $4, $5, $6, 'queued')
      `,
      [
        input.propertyId ?? null,
        event.target_role,
        event.target_user_id,
        input.title,
        input.body,
        input.data ? JSON.stringify(input.data) : null,
      ],
    );
  }

  const tokenResult = await db.query<{ expo_push_token: string }>(
    `
      select distinct dpt.expo_push_token
      from device_push_tokens dpt
      where
        dpt.is_active = true
        and ($1::uuid is null or dpt.property_id = $1::uuid)
        and (
          (cardinality($2::text[]) > 0 and dpt.role = any($2::text[]))
          or (cardinality($3::uuid[]) > 0 and dpt.user_id = any($3::uuid[]))
        )
    `,
    [input.propertyId ?? null, targetRoles, targetUserIds],
  );

  await sendExpoPushMessages(
    tokenResult.rows.map((row) => ({
      to: row.expo_push_token,
      sound: "default",
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    })),
  );
}
