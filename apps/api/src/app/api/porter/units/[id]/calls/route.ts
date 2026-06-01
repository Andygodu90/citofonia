import { db } from "@/lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    notes?: string;
  };

  const contactResult = await db.query(
    `
      select
        p.id as property_id,
        u.id as unit_id,
        c.id as contact_id
      from residential_units u
      join properties p on p.id = u.property_id
      join residents r on r.unit_id = u.id and r.is_active = true
      join resident_contacts c on c.resident_id = r.id and c.is_active = true and c.call_enabled = true
      where u.id = $1 and u.is_active = true
      order by c.priority asc
      limit 1
    `,
    [id],
  );

  if (contactResult.rowCount === 0) {
    return Response.json(
      { error: "No hay contacto habilitado para llamada" },
      { status: 404 },
    );
  }

  const contact = contactResult.rows[0];
  const logResult = await db.query(
    `
      insert into call_logs (property_id, unit_id, contact_id, status, notes)
      values ($1, $2, $3, $4, $5)
      returning id, status, started_at
    `,
    [
      contact.property_id,
      contact.unit_id,
      contact.contact_id,
      body.status ?? "initiated",
      body.notes ?? "Intento registrado desde app de porteria",
    ],
  );

  return Response.json({
    call: {
      id: logResult.rows[0].id,
      status: logResult.rows[0].status,
      startedAt: logResult.rows[0].started_at,
      message: "Intento de llamada registrado. Numero real protegido.",
    },
  });
}
