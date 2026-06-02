"use client";

import { useState } from "react";

type Summary = {
  units: number;
  residents: number;
  users: number;
  visitors: number;
  pending: number;
  inside: number;
};

type Unit = {
  id: string;
  display_label: string;
  block: string;
  unit_number: string;
  is_active: boolean;
  residents: number;
  contacts: number;
};

type Resident = {
  id: string;
  full_name: string;
  document_id: string | null;
  unit_label: string;
  phone: string;
  is_active: boolean;
};

type User = {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
};

type ReportSummary = {
  visit_requests: number;
  approved: number;
  rejected: number;
  inside: number;
  entries: number;
  exits: number;
  calls: number;
  answered: number;
  missed: number;
};

type ReportRow = {
  id: string;
  type: string;
  title: string;
  unitLabel: string | null;
  status: string;
  actor: string | null;
  occurredAt: string;
};

type AuditItem = {
  id: string;
  action: string;
  entityType: string | null;
  actor: string | null;
  createdAt: string;
};

type ImportResult = {
  dryRun?: boolean;
  parsedRows?: number;
  imported?: number;
  createdResidents?: number;
  updatedResidents?: number;
  createdContacts?: number;
  updatedContacts?: number;
  skippedRows?: string[];
  errors?: string[];
};

export function AdminDashboard() {
  const [apiToken, setApiToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123*");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [unitQuery, setUnitQuery] = useState("31");
  const [residentQuery, setResidentQuery] = useState("");
  const [reportUnitQuery, setReportUnitQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [residentName, setResidentName] = useState("");
  const [residentDocument, setResidentDocument] = useState("");
  const [residentPhone, setResidentPhone] = useState("");
  const [residentCsv, setResidentCsv] = useState(
    "bloque,apartamento,nombre,documento,telefono,email,tipo\n35,1C,Residente de prueba,123456789,3148337748,residente@example.com,resident",
  );
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("Porteria123*");
  const [newRole, setNewRole] = useState("porter");
  const [message, setMessage] = useState("Inicia sesion para cargar el panel.");
  const [loading, setLoading] = useState(false);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "No se pudo completar la solicitud");
    }

    return data as T;
  }

  async function login() {
    setLoading(true);
    setMessage("Validando administrador...");

    try {
      const data = await api<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setApiToken(data.token);
      setMessage("Sesion administrativa iniciada.");
      await loadDashboard(data.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error iniciando sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(tokenOverride?: string) {
    setLoading(true);

    try {
      const headers = {
        Authorization: `Bearer ${tokenOverride ?? apiToken}`,
      };
      const reportQuery = new URLSearchParams({
        unit: reportUnitQuery,
        status: reportStatus,
      });
      const auditQuery = new URLSearchParams({ action: auditAction });
      const [
        summaryData,
        unitsData,
        residentsData,
        usersData,
        reportsData,
        auditData,
      ] = await Promise.all([
        fetch("/api/admin/summary", { headers }).then((res) => res.json()),
        fetch(`/api/admin/units?query=${encodeURIComponent(unitQuery)}`, {
          headers,
        }).then((res) => res.json()),
        fetch(`/api/admin/residents?query=${encodeURIComponent(residentQuery)}`, {
          headers,
        }).then((res) => res.json()),
        fetch("/api/admin/users", { headers }).then((res) => res.json()),
        fetch(`/api/admin/reports?${reportQuery.toString()}`, { headers }).then((res) =>
          res.json(),
        ),
        fetch(`/api/admin/audit?${auditQuery.toString()}`, { headers }).then((res) =>
          res.json(),
        ),
      ]);

      if (
        summaryData.error ||
        unitsData.error ||
        residentsData.error ||
        usersData.error ||
        reportsData.error ||
        auditData.error
      ) {
        throw new Error(
          summaryData.error ??
            unitsData.error ??
            residentsData.error ??
            usersData.error ??
            reportsData.error ??
            auditData.error,
        );
      }

      setSummary(summaryData.summary);
      setUnits(unitsData.units);
      setResidents(residentsData.residents);
      setUsers(usersData.users);
      setReportSummary(reportsData.summary);
      setReportRows(reportsData.rows);
      setAuditItems(auditData.items);
      setMessage("Panel actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error cargando panel.");
    } finally {
      setLoading(false);
    }
  }

  async function createResident() {
    if (!selectedUnitId) {
      setMessage("Selecciona una unidad desde el listado.");
      return;
    }

    setLoading(true);

    try {
      await api("/api/admin/residents", {
        method: "POST",
        body: JSON.stringify({
          unitId: selectedUnitId,
          fullName: residentName,
          documentId: residentDocument,
          phone: residentPhone,
        }),
      });
      setResidentName("");
      setResidentDocument("");
      setResidentPhone("");
      setMessage("Residente creado.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error creando residente.");
    } finally {
      setLoading(false);
    }
  }

  async function importResidents(dryRun: boolean) {
    setLoading(true);
    setMessage(
      dryRun ? "Validando CSV de residentes..." : "Importando residentes...",
    );

    try {
      const data = await api<ImportResult>("/api/admin/import/residents", {
        method: "POST",
        body: JSON.stringify({
          csv: residentCsv,
          dryRun,
        }),
      });
      setImportResult(data);
      setMessage(
        dryRun
          ? `CSV validado. Filas legibles: ${data.parsedRows ?? 0}.`
          : `Carga finalizada. Residentes procesados: ${data.imported ?? 0}.`,
      );

      if (!dryRun) {
        await loadDashboard();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Error importando residentes.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createUser() {
    setLoading(true);

    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });
      setNewUsername("");
      setMessage("Usuario creado o actualizado.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error creando usuario.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUnitStatus(unitId: string, isActive: boolean) {
    setLoading(true);

    try {
      await api(`/api/admin/units/${unitId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMessage(isActive ? "Unidad activada." : "Unidad desactivada.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error actualizando unidad.");
    } finally {
      setLoading(false);
    }
  }

  async function updateResidentStatus(residentId: string, isActive: boolean) {
    setLoading(true);

    try {
      await api(`/api/admin/residents/${residentId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMessage(isActive ? "Residente activado." : "Residente desactivado.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error actualizando residente.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(userId: string, isActive: boolean) {
    setLoading(true);

    try {
      await api(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMessage(isActive ? "Usuario activado." : "Usuario desactivado.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error actualizando usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase text-blue-700">Administracion</p>
        <h1 className="text-3xl font-black text-zinc-950">
          Arcadas de San Isidro
        </h1>
        <p className="text-zinc-600">
          Gestion inicial de unidades, residentes y usuarios del sistema.
        </p>
      </section>

      <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Usuario"
          value={username}
        />
        <input
          className="rounded-md border border-zinc-300 px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contrasena"
          type="password"
          value={password}
        />
        <button
          className="rounded-md bg-zinc-950 px-4 py-2 font-bold text-white"
          disabled={loading}
          onClick={login}
        >
          Ingresar
        </button>
        <button
          className="rounded-md border border-zinc-300 px-4 py-2 font-bold"
          disabled={loading || !apiToken}
          onClick={() => loadDashboard()}
        >
          Actualizar
        </button>
        <p className="md:col-span-4 text-sm text-zinc-600">{message}</p>
      </section>

      {summary ? (
        <section className="grid gap-3 md:grid-cols-6">
          {Object.entries(summary).map(([key, value]) => (
            <div
              className="rounded-lg border border-zinc-200 bg-white p-4"
              key={key}
            >
              <p className="text-xs font-bold uppercase text-zinc-500">{key}</p>
              <p className="mt-1 text-2xl font-black text-zinc-950">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2"
              onChange={(event) => setUnitQuery(event.target.value)}
              placeholder="Buscar unidad"
              value={unitQuery}
            />
            <button
              className="rounded-md bg-zinc-950 px-4 py-2 font-bold text-white"
              disabled={loading || !apiToken}
              onClick={() => loadDashboard()}
            >
              Buscar
            </button>
          </div>
          <h2 className="mb-3 text-lg font-black">Unidades</h2>
          <div className="flex max-h-96 flex-col gap-2 overflow-auto">
            {units.map((unit) => (
              <button
                className={`rounded-md border p-3 text-left ${
                  selectedUnitId === unit.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200"
                }`}
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
              >
                <p className="font-black">{unit.display_label}</p>
                <p className="text-sm text-zinc-600">
                  Residentes: {unit.residents} - Contactos: {unit.contacts}
                </p>
                <p className="mt-1 text-xs font-bold uppercase text-zinc-500">
                  {unit.is_active ? "activo" : "inactivo"}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-md px-3 py-2 text-sm font-bold ${
                    unit.is_active
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void updateUnitStatus(unit.id, !unit.is_active);
                  }}
                >
                  {unit.is_active ? "Desactivar" : "Activar"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-black">Crear residente</h2>
          <div className="grid gap-3">
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              onChange={(event) => setResidentName(event.target.value)}
              placeholder="Nombre completo"
              value={residentName}
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              onChange={(event) => setResidentDocument(event.target.value)}
              placeholder="Documento"
              value={residentDocument}
            />
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              onChange={(event) => setResidentPhone(event.target.value)}
              placeholder="Telefono"
              value={residentPhone}
            />
            <button
              className="rounded-md bg-amber-500 px-4 py-2 font-black text-zinc-950"
              disabled={loading || !apiToken}
              onClick={createResident}
            >
              Crear residente en unidad seleccionada
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2"
                onChange={(event) => setResidentQuery(event.target.value)}
                placeholder="Buscar residente"
                value={residentQuery}
              />
              <button
                className="rounded-md border border-zinc-300 px-4 py-2 font-bold"
                disabled={loading || !apiToken}
                onClick={() => loadDashboard()}
              >
                Buscar
              </button>
            </div>
            <div className="flex max-h-72 flex-col gap-2 overflow-auto">
              {residents.map((resident) => (
                <div className="rounded-md border border-zinc-200 p-3" key={resident.id}>
                  <p className="font-black">{resident.full_name}</p>
                  <p className="text-sm text-zinc-600">
                    {resident.unit_label} - {resident.document_id ?? "sin documento"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase text-zinc-500">
                    {resident.is_active ? "activo" : "inactivo"}
                  </p>
                  <button
                    className={`mt-3 rounded-md px-3 py-2 text-sm font-bold ${
                      resident.is_active
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                    disabled={loading || !apiToken}
                    onClick={() => updateResidentStatus(resident.id, !resident.is_active)}
                  >
                    {resident.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase text-blue-700">
            Carga masiva
          </p>
          <h2 className="text-lg font-black">Importar residentes por CSV</h2>
          <p className="text-sm text-zinc-600">
            Usa encabezados: bloque, apartamento, nombre, documento, telefono,
            email y tipo.
          </p>
        </div>

        <textarea
          className="mt-4 min-h-40 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
          onChange={(event) => setResidentCsv(event.target.value)}
          value={residentCsv}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 font-bold"
            disabled={loading || !apiToken}
            onClick={() => importResidents(true)}
          >
            Validar CSV
          </button>
          <button
            className="rounded-md bg-blue-700 px-4 py-2 font-bold text-white"
            disabled={loading || !apiToken}
            onClick={() => importResidents(false)}
          >
            Cargar residentes
          </button>
        </div>

        {importResult ? (
          <div className="mt-4 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
            <p className="font-black text-zinc-950">
              {importResult.dryRun ? "Resultado de validacion" : "Resultado de carga"}
            </p>
            <p>
              Filas: {importResult.parsedRows ?? importResult.imported ?? 0} -
              Creados: {importResult.createdResidents ?? 0} - Actualizados:{" "}
              {importResult.updatedResidents ?? 0}
            </p>
            <p>
              Contactos creados: {importResult.createdContacts ?? 0} -
              Contactos actualizados: {importResult.updatedContacts ?? 0}
            </p>
            {[...(importResult.errors ?? []), ...(importResult.skippedRows ?? [])]
              .slice(0, 8)
              .map((item) => (
                <p className="mt-1 text-red-700" key={item}>
                  {item}
                </p>
              ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black">Usuarios</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setNewUsername(event.target.value)}
            placeholder="Nuevo usuario"
            value={newUsername}
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Contrasena"
            value={newPassword}
          />
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setNewRole(event.target.value)}
            value={newRole}
          >
            <option value="porter">Porteria</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            className="rounded-md bg-zinc-950 px-4 py-2 font-bold text-white"
            disabled={loading || !apiToken}
            onClick={createUser}
          >
            Crear usuario
          </button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {users.map((user) => (
            <div className="rounded-md border border-zinc-200 p-3" key={user.id}>
              <p className="font-black">{user.username}</p>
              <p className="text-sm text-zinc-600">
                {user.role} - {user.is_active ? "activo" : "inactivo"}
              </p>
              <button
                className={`mt-3 rounded-md px-3 py-2 text-sm font-bold ${
                  user.is_active
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
                disabled={loading || !apiToken}
                onClick={() => updateUserStatus(user.id, !user.is_active)}
              >
                {user.is_active ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-black">Reportes</h2>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setReportUnitQuery(event.target.value)}
            placeholder="Filtrar unidad"
            value={reportUnitQuery}
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setReportStatus(event.target.value)}
            placeholder="Estado"
            value={reportStatus}
          />
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            onChange={(event) => setAuditAction(event.target.value)}
            placeholder="Accion auditada"
            value={auditAction}
          />
          <button
            className="rounded-md bg-zinc-950 px-4 py-2 font-bold text-white"
            disabled={loading || !apiToken}
            onClick={() => loadDashboard()}
          >
            Consultar
          </button>
        </div>

        {reportSummary ? (
          <div className="mb-4 grid gap-2 md:grid-cols-5">
            {Object.entries(reportSummary).map(([key, value]) => (
              <div className="rounded-md bg-zinc-50 p-3" key={key}>
                <p className="text-xs font-bold uppercase text-zinc-500">{key}</p>
                <p className="text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-black">Actividad operativa</h3>
            <div className="flex max-h-96 flex-col gap-2 overflow-auto">
              {reportRows.map((row) => (
                <div className="rounded-md border border-zinc-200 p-3" key={row.id}>
                  <p className="text-xs font-bold uppercase text-blue-700">
                    {row.type} - {row.status}
                  </p>
                  <p className="font-black">{row.title}</p>
                  <p className="text-sm text-zinc-600">
                    {row.unitLabel ?? "Sin unidad"} - {row.actor ?? "Sistema"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-black">Auditoria reciente</h3>
            <div className="flex max-h-96 flex-col gap-2 overflow-auto">
              {auditItems.map((item) => (
                <div className="rounded-md border border-zinc-200 p-3" key={item.id}>
                  <p className="font-black">{item.action}</p>
                  <p className="text-sm text-zinc-600">
                    {item.entityType ?? "sistema"} - {item.actor ?? "Sistema"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
