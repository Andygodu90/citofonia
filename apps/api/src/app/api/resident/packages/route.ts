import { requireResidentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireResidentSession(request);

  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await db.query(
    `
      select
        pd.id,
        u.display_label as unit_label,
        pd.recipient_name,
        pd.package_type,
        pd.status,
        pd.delivered_at,
        pd.created_at
      from package_deliveries pd
      join residential_units u on u.id = pd.unit_id
      join residents r on r.unit_id = u.id
      where r.id = $1
      order by pd.created_at desc
      limit 20
    `,
    [session.residentId],
  );

  return Response.json({
    items: result.rows.map((row) => ({
      id: row.id,
      unitLabel: row.unit_label,
      recipientName: row.recipient_name,
      packageType: row.package_type,
      status: row.status,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
    })),
  });
}
