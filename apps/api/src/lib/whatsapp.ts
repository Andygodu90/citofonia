type WhatsAppSendResult = {
  mode: "cloud" | "mock";
  providerMessageId: string | null;
  status: string;
};

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  };
}

export function isWhatsAppCloudConfigured() {
  const config = getWhatsAppConfig();

  return Boolean(config.accessToken && config.phoneNumberId);
}

export async function sendWhatsAppText(input: {
  to: string;
  body: string;
}): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();

  if (!config.accessToken || !config.phoneNumberId) {
    return {
      mode: "mock",
      providerMessageId: null,
      status: "mocked",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to.replace(/^\+/, ""),
        type: "text",
        text: {
          preview_url: false,
          body: input.body,
        },
      }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "WhatsApp Cloud no pudo enviar el mensaje");
  }

  return {
    mode: "cloud",
    providerMessageId: data.messages?.[0]?.id ?? null,
    status: "sent",
  };
}
