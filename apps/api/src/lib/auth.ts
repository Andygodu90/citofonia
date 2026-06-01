import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_SECONDS = 8 * 60 * 60;
const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

type SessionPayload = {
  sub: string;
  username: string;
  role: string;
  propertyId: string | null;
  residentId?: string | null;
  exp: number;
};

export type AuthSession = Omit<SessionPayload, "sub"> & {
  userId: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters");
  }

  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(
    password,
    salt,
    PASSWORD_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
  ).toString("base64url");

  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsRaw, salt, hash] = storedHash.split("$");

  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !hash) {
    return false;
  }

  const computed = pbkdf2Sync(
    password,
    salt,
    Number(iterationsRaw),
    PASSWORD_KEY_LENGTH,
    PASSWORD_DIGEST,
  );

  const stored = Buffer.from(hash, "base64url");

  if (computed.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(computed, stored);
}

export function createToken(payload: Omit<SessionPayload, "exp">) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }),
  );
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): AuthSession | null {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    return null;
  }

  const expectedSignature = sign(`${header}.${body}`);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    userId: payload.sub,
    username: payload.username,
    role: payload.role,
    propertyId: payload.propertyId,
    residentId: payload.residentId ?? null,
    exp: payload.exp,
  };
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice("bearer ".length).trim();
}

export async function requirePorterSession(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const session = verifyToken(token);

  if (!session || !["porter", "admin", "superadmin"].includes(session.role)) {
    return null;
  }

  return session;
}

export async function requireAdminSession(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const session = verifyToken(token);

  if (!session || !["admin", "superadmin"].includes(session.role)) {
    return null;
  }

  return session;
}

export async function requireResidentSession(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const session = verifyToken(token);

  if (!session || session.role !== "resident" || !session.residentId) {
    return null;
  }

  return session;
}

export async function auditEvent(input: {
  propertyId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.query(
    `
      insert into audit_events (
        property_id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6)
    `,
    [
      input.propertyId ?? null,
      input.actorUserId ?? null,
      input.action,
      input.entityType ?? null,
      input.entityId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );
}
