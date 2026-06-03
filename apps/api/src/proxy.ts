import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:8082",
  "http://127.0.0.1:8082",
];

function getAllowedOrigins() {
  const configured = process.env.APP_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0
    ? configured
    : DEFAULT_ALLOWED_ORIGINS;
}

function isPrivateLanOrigin(origin: string) {
  return /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8082$/.test(origin);
}

function getCorsOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  if (getAllowedOrigins().includes(origin) || isPrivateLanOrigin(origin)) {
    return origin;
  }

  return null;
}

function applyCors(response: NextResponse, origin: string | null) {
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  );

  return response;
}

export function proxy(request: NextRequest) {
  const origin = getCorsOrigin(request);

  if (request.method === "OPTIONS") {
    return applyCors(new NextResponse(null, { status: 204 }), origin);
  }

  return applyCors(NextResponse.next(), origin);
}

export const config = {
  matcher: "/api/:path*",
};
