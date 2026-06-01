export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          API Citofonia
        </p>
        <h1 className="text-4xl font-bold">Backend del proyecto</h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600">
          Este servicio manejara residentes, unidades, llamadas, mensajes de
          WhatsApp Business y auditoria sin exponer datos privados a la app de
          porteria.
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <p className="font-mono text-sm text-zinc-700">
            GET /api/health
          </p>
        </div>
      </main>
    </div>
  );
}
