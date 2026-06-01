export function GET() {
  return Response.json({
    ok: true,
    service: "citofonia-api",
    timestamp: new Date().toISOString(),
  });
}
