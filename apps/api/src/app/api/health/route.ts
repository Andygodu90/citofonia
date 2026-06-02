import { db } from "@/lib/db";
import { getWhatsAppAuthorizationTemplate } from "@/lib/whatsapp";

export const runtime = "nodejs";

function hasMinLength(value: string | undefined, minLength: number) {
  return Boolean(value && value.length >= minLength);
}

export async function GET() {
  let database = {
    ok: false,
    latencyMs: null as number | null,
    error: null as string | null,
  };

  const startedAt = Date.now();

  try {
    await db.query("select 1");
    database = {
      ok: true,
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    database = {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Database unavailable",
    };
  }

  const auth = {
    configured: hasMinLength(process.env.AUTH_SECRET, 32),
  };

  const whatsapp = {
    accessTokenConfigured: hasMinLength(process.env.WHATSAPP_ACCESS_TOKEN, 20),
    phoneNumberIdConfigured: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    verifyTokenConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    authorizationTemplate: getWhatsAppAuthorizationTemplate(),
  };

  const deployment = {
    publicBaseUrlConfigured: Boolean(process.env.APP_PUBLIC_BASE_URL),
    publicBaseUrl: process.env.APP_PUBLIC_BASE_URL ?? null,
  };

  const ready =
    database.ok &&
    auth.configured &&
    whatsapp.accessTokenConfigured &&
    whatsapp.phoneNumberIdConfigured;

  return Response.json({
    ok: ready,
    service: "citofonia-api",
    checks: {
      database,
      auth,
      whatsapp,
      deployment,
    },
    timestamp: new Date().toISOString(),
  });
}
