"use client";

import {
  Building2,
  FileText,
  MessageCircle,
  Search,
  Send,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Summary = {
  units: number;
  residents: number;
  users: number;
  visitors: number;
  blocked_units: number;
  pending: number;
  inside: number;
};

type Unit = {
  id: string;
  display_label: string;
  block: string;
  unit_number: string;
  is_active: boolean;
  is_access_blocked: boolean;
  access_block_reason: string | null;
  access_blocked_at?: string | null;
  car_plate: string | null;
  motorcycle_plate: string | null;
  residents: number;
  contacts: number;
};

type Resident = {
  id: string;
  unit_id: string;
  full_name: string;
  document_id: string | null;
  email: string | null;
  unit_label: string;
  phone: string;
  is_active: boolean;
  show_name_to_porter: boolean;
  show_phone_to_porter: boolean;
  car_plate: string | null;
  motorcycle_plate: string | null;
};

type User = {
  id: string;
  username: string;
  role: string;
  is_active: boolean;
};

type ChatThread = {
  unitId: string;
  unitLabel: string;
  residentName: string;
  phone: string;
  lastMessage: string;
  lastDirection: string | null;
  lastAt: string | null;
  hasThread: boolean;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  body: string;
  providerStatus: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

type Section = "dashboard" | "units" | "residents" | "users" | "messages" | "reports";

type AuthUser = {
  id: string;
  username: string;
  role: string;
  propertyId: string | null;
  residentId: string | null;
};

const adminSessionKey = "citofonia_admin_session";
const adminRoles = ["admin", "superadmin"];
const sectionPaths: Record<Section, string> = {
  dashboard: "/admin",
  units: "/admin/unidades",
  residents: "/admin/residentes",
  users: "/admin/roles",
  messages: "/admin/mensajeria",
  reports: "/admin/reportes",
};

type StoredAdminSession = {
  token: string;
  user: AuthUser;
};

function readStoredAdminSession(): StoredAdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedSession = window.sessionStorage.getItem(adminSessionKey);

    if (!storedSession) {
      return null;
    }

    const parsed = JSON.parse(storedSession) as Partial<StoredAdminSession>;

    if (!parsed.token || !parsed.user || !adminRoles.includes(parsed.user.role)) {
      window.sessionStorage.removeItem(adminSessionKey);
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user,
    };
  } catch {
    window.sessionStorage.removeItem(adminSessionKey);
    return null;
  }
}

export function AdminDashboard({
  initialSection = "dashboard",
}: {
  initialSection?: Section;
}) {
  const router = useRouter();
  const [storedAuth] = useState(readStoredAdminSession);
  const [section, setSection] = useState<Section>(initialSection);
  const [apiToken, setApiToken] = useState(storedAuth?.token ?? "");
  const [session, setSession] = useState<AuthUser | null>(storedAuth?.user ?? null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [unitQuery, setUnitQuery] = useState("");
  const [residentQuery, setResidentQuery] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [detailUnitId, setDetailUnitId] = useState("");
  const [residentModalOpen, setResidentModalOpen] = useState(false);
  const [residentUnitId, setResidentUnitId] = useState("");
  const [editingResidentId, setEditingResidentId] = useState("");
  const [residentName, setResidentName] = useState("");
  const [residentDocument, setResidentDocument] = useState("");
  const [residentPhone, setResidentPhone] = useState("");
  const [residentEmail, setResidentEmail] = useState("");
  const [residentCarPlate, setResidentCarPlate] = useState("");
  const [residentMotorcyclePlate, setResidentMotorcyclePlate] = useState("");
  const [residentShowNameToPorter, setResidentShowNameToPorter] = useState(false);
  const [residentShowPhoneToPorter, setResidentShowPhoneToPorter] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("porter");
  const [userModalId, setUserModalId] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("porter");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [messageText, setMessageText] = useState(
    "Buen dia. La administracion tiene una comunicacion para su unidad.",
  );
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [notice, setNotice] = useState("Inicia sesion para cargar el panel.");
  const [loading, setLoading] = useState(false);
  const [blockingUnitId, setBlockingUnitId] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const detailUnit = useMemo(
    () => units.find((unit) => unit.id === detailUnitId) ?? null,
    [detailUnitId, units],
  );
  const residentModalUnit = useMemo(
    () => units.find((unit) => unit.id === residentUnitId) ?? null,
    [residentUnitId, units],
  );
  const selectedUnitResident = useMemo(
    () => residents.find((resident) => resident.unit_id === residentUnitId) ?? null,
    [residentUnitId, residents],
  );
  const userModal = useMemo(
    () => users.find((user) => user.id === userModalId) ?? null,
    [userModalId, users],
  );

  useEffect(() => {
    if (apiToken && session) {
      void loadDashboard(apiToken);
      if (section === "messages") {
        void loadChats();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToken, session, section]);

  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        ...options?.headers,
      },
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error ?? "No se pudo completar la solicitud.");
    }

    return data as T;
  }

  async function login() {
    setLoading(true);
    setNotice("Validando credenciales...");

    try {
      const data = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (!adminRoles.includes(data.user.role)) {
        window.sessionStorage.removeItem(adminSessionKey);
        setApiToken("");
        setSession(null);
        setNotice("Este panel web solo esta habilitado para Admin y Superadmin.");
        return;
      }

      window.sessionStorage.setItem(
        adminSessionKey,
        JSON.stringify({ token: data.token, user: data.user }),
      );
      setApiToken(data.token);
      setSession(data.user);
      setPassword("");
      setNotice("Sesion iniciada.");
      await loadDashboard(data.token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error iniciando sesion.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem(adminSessionKey);
    setApiToken("");
    setSession(null);
    setProfileMenuOpen(false);
    setSummary(null);
    setUnits([]);
    setResidents([]);
    setUsers([]);
    setSelectedUnitId("");
    setDetailUnitId("");
    setPassword("");
    setNotice("Ingresa tus credenciales para acceder al panel.");
  }

  function changeSection(nextSection: Section) {
    setSection(nextSection);
    router.push(sectionPaths[nextSection]);
    setUnitQuery("");
    setResidentQuery("");
    setResidentModalOpen(false);
    setUserModalId("");
    setDetailUnitId("");
    void loadDashboard(undefined, { unitQuery: "", residentQuery: "" });
    if (nextSection === "messages") {
      void loadChats();
    }
  }

  function openResidentModal(unitId = selectedUnitId) {
    const currentResident = residents.find((resident) => resident.unit_id === unitId);
    const currentUnit = units.find((unit) => unit.id === unitId);

    setResidentUnitId(unitId);
    setEditingResidentId(currentResident?.id ?? "");
    setResidentName(currentResident?.full_name ?? "");
    setResidentDocument(currentResident?.document_id ?? "");
    setResidentPhone(currentResident?.phone ?? "");
    setResidentEmail(currentResident?.email ?? "");
    setResidentCarPlate(currentUnit?.car_plate ?? currentResident?.car_plate ?? "");
    setResidentMotorcyclePlate(
      currentUnit?.motorcycle_plate ?? currentResident?.motorcycle_plate ?? "",
    );
    setResidentShowNameToPorter(currentResident?.show_name_to_porter ?? false);
    setResidentShowPhoneToPorter(currentResident?.show_phone_to_porter ?? false);
    setResidentModalOpen(true);
  }

  function closeResidentModal() {
    setResidentModalOpen(false);
    setEditingResidentId("");
    setResidentName("");
    setResidentDocument("");
    setResidentPhone("");
    setResidentEmail("");
    setResidentCarPlate("");
    setResidentMotorcyclePlate("");
    setResidentShowNameToPorter(false);
    setResidentShowPhoneToPorter(false);
  }

  function openUserModal(user: User) {
    setUserModalId(user.id);
    setEditUsername(user.username);
    setEditPassword("");
    setEditRole(user.role);
  }

  async function loadDashboard(
    tokenOverride?: string,
    filters?: { unitQuery?: string; residentQuery?: string },
  ) {
    const token = tokenOverride ?? apiToken;
    const nextUnitQuery = filters?.unitQuery ?? unitQuery;
    const nextResidentQuery = filters?.residentQuery ?? residentQuery;

    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryData, unitsData, residentsData, usersData] = await Promise.all([
        fetch("/api/admin/summary", { headers }).then((res) => res.json()),
        fetch(`/api/admin/units?query=${encodeURIComponent(nextUnitQuery)}`, {
          headers,
        }).then((res) => res.json()),
        fetch(`/api/admin/residents?query=${encodeURIComponent(nextResidentQuery)}`, {
          headers,
        }).then((res) => res.json()),
        fetch("/api/admin/users", { headers }).then((res) => res.json()),
      ]);

      if (summaryData.error || unitsData.error || residentsData.error || usersData.error) {
        throw new Error(
          summaryData.error ?? unitsData.error ?? residentsData.error ?? usersData.error,
        );
      }

      setSummary(summaryData.summary);
      setUnits(unitsData.units);
      setResidents(residentsData.residents);
      setUsers(usersData.users);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error cargando panel.");
    } finally {
      setLoading(false);
    }
  }

  async function loadChats(nextSelectedUnitId?: string) {
    try {
      const data = await api<{ chats: ChatThread[] }>("/api/admin/messages?limit=25");
      setChatThreads(data.chats);

      const targetUnitId = nextSelectedUnitId || selectedUnitId || data.chats[0]?.unitId || "";
      if (targetUnitId) {
        await selectChat(targetUnitId);
      } else {
        setChatMessages([]);
        setChatHasMore(false);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error cargando chats.");
    }
  }

  async function selectChat(unitId: string) {
    setSelectedUnitId(unitId);
    setLoadingOlderMessages(true);

    try {
      const data = await api<{ messages: ChatMessage[]; hasMore: boolean }>(
        `/api/admin/messages/${unitId}?limit=25`,
      );
      setChatMessages(data.messages);
      setChatHasMore(data.hasMore);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error cargando conversacion.");
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  async function loadOlderMessages() {
    if (!selectedUnitId || !chatHasMore || loadingOlderMessages || chatMessages.length === 0) {
      return;
    }

    setLoadingOlderMessages(true);

    try {
      const before = encodeURIComponent(chatMessages[0].sentAt);
      const data = await api<{ messages: ChatMessage[]; hasMore: boolean }>(
        `/api/admin/messages/${selectedUnitId}?limit=25&before=${before}`,
      );
      setChatMessages((current) => [...data.messages, ...current]);
      setChatHasMore(data.hasMore);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error cargando mensajes anteriores.");
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  async function createResident() {
    const targetResident = editingResidentId || selectedUnitResident?.id || "";

    if (!residentUnitId || !residentName.trim()) {
      setNotice("Selecciona una unidad y escribe el nombre del residente.");
      return;
    }

    setLoading(true);

    try {
      if (targetResident) {
        await api(`/api/admin/residents/${targetResident}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: residentName,
            documentId: residentDocument,
            phone: residentPhone,
            email: residentEmail,
            showNameToPorter: residentShowNameToPorter,
            showPhoneToPorter: residentShowPhoneToPorter,
          }),
        });
        setNotice("Residente actualizado.");
      } else {
        await api("/api/admin/residents", {
          method: "POST",
          body: JSON.stringify({
            unitId: residentUnitId,
            fullName: residentName,
            documentId: residentDocument,
            phone: residentPhone,
            email: residentEmail,
            showNameToPorter: residentShowNameToPorter,
            showPhoneToPorter: residentShowPhoneToPorter,
          }),
        });
        setNotice("Residente creado.");
      }

      await api(`/api/admin/units/${residentUnitId}`, {
        method: "PATCH",
        body: JSON.stringify({
          carPlate: residentCarPlate,
          motorcyclePlate: residentMotorcyclePlate,
        }),
      });

      closeResidentModal();
      await loadDashboard();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error creando residente.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUnit(
    unit: Unit,
    patch: Record<string, unknown>,
    options?: { blocking?: boolean },
  ) {
    setLoading(true);
    if (options?.blocking) {
      setBlockingUnitId(unit.id);
    }

    try {
      await api(`/api/admin/units/${unit.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setNotice("Unidad actualizada.");
      await loadDashboard();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error actualizando unidad.");
    } finally {
      setLoading(false);
      if (options?.blocking) {
        setBlockingUnitId("");
      }
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
      setNewPassword("");
      setNotice("Usuario creado o actualizado.");
      await loadDashboard();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error creando usuario.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(
    user: User,
    patch: Record<string, unknown>,
    options?: { statusChange?: boolean },
  ) {
    setLoading(true);
    if (options?.statusChange) {
      setUpdatingUserId(user.id);
    }

    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setNotice("Usuario actualizado.");
      await loadDashboard();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error actualizando usuario.");
    } finally {
      setLoading(false);
      if (options?.statusChange) {
        setUpdatingUserId("");
      }
    }
  }

  async function saveUserModal() {
    if (!userModal) {
      return;
    }

    await updateUser(userModal, {
      username: editUsername,
      password: editPassword,
      role: editRole,
    });
    setUserModalId("");
    setEditPassword("");
  }

  async function sendMessage() {
    if (!selectedUnitId || !messageText.trim()) {
      setNotice("Selecciona una unidad y escribe el mensaje.");
      return;
    }

    setLoading(true);

    try {
      await api(`/api/porter/units/${selectedUnitId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: messageText, sendMode: "text" }),
      });
      setMessageText("");
      setNotice("Mensaje enviado y notificacion registrada.");
      await loadChats(selectedUnitId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error enviando mensaje.");
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(kind: "activity" | "units" | "blocked_units", format: "csv" | "xlsx" | "pdf") {
    if (!apiToken) {
      setNotice("Inicia sesion para exportar.");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ kind, format });
      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo exportar el reporte.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${kind}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice("Reporte generado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Error generando reporte.");
    } finally {
      setLoading(false);
    }
  }

  const navItems: Array<{ key: Section; label: string }> = [
    { key: "dashboard", label: "Inicio" },
    { key: "units", label: "Unidades" },
    { key: "residents", label: "Residentes" },
    { key: "users", label: "Roles" },
    { key: "messages", label: "Mensajeria" },
    { key: "reports", label: "Reportes" },
  ];
  const moduleIcons: Partial<Record<Section, LucideIcon>> = {
    units: Building2,
    residents: UsersRound,
    users: UserCog,
    messages: MessageCircle,
    reports: FileText,
  };

  if (!session || !apiToken) {
    return (
      <AdminLogin
        loading={loading}
        notice={notice}
        onLogin={login}
        password={password}
        setPassword={setPassword}
        setUsername={setUsername}
        username={username}
      />
    );
  }

  return (
    <>
    <main className="min-h-screen bg-[#F7FAFD] text-[#123047]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-[#DCE8F5] bg-white p-6">
          <div className="rounded-2xl bg-[#EAF4FF] p-4">
            <p className="text-xs font-black uppercase text-[#1877F2]">Citofonia</p>
            <h1 className="mt-1 text-2xl font-black">Arcadas</h1>
            <p className="mt-1 text-sm text-[#5B6F8A]">Administracion web</p>
          </div>
          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => (
              <button
                className={`rounded-lg px-4 py-3 text-left text-sm font-black ${
                  section === item.key
                    ? "bg-[#1877F2] text-white"
                    : "text-[#5B6F8A] hover:bg-[#EAF4FF]"
                }`}
                key={item.key}
                onClick={() => changeSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-4 border-b border-[#DCE8F5] bg-white px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#1877F2]">Panel administrativo</p>
              <h2 className="text-3xl font-black">Arcadas de San Isidro</h2>
              <p className="text-sm text-[#5B6F8A]">
                Gestiona roles, residentes, bloqueos, mensajeria y reportes.
              </p>
            </div>
            <UserProfileMenu
              isOpen={profileMenuOpen}
              onClose={() => setProfileMenuOpen(false)}
              onLogout={logout}
              onToggle={() => setProfileMenuOpen((isOpen) => !isOpen)}
              user={session}
            />
          </header>

          <div className="grid gap-6 px-6 py-6 pb-24">
            {section === "dashboard" ? (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  {[
                    ["Unidades", summary?.units ?? 0],
                    ["Residentes", summary?.residents ?? 0],
                    ["Bloqueadas", summary?.blocked_units ?? 0],
                  ].map(([label, value]) => (
                    <div className="rounded-xl border border-[#DCE8F5] bg-white p-6" key={label}>
                      <p className="text-sm font-bold text-[#5B6F8A]">{label}</p>
                      <p className="mt-4 text-5xl font-black">{value}</p>
                    </div>
                  ))}
                </section>
                <section className="grid gap-4 lg:grid-cols-3">
                  {navItems.slice(1).map((item) => {
                    const Icon = moduleIcons[item.key];

                    return (
                      <button
                        className="group flex items-center justify-between gap-5 rounded-xl border border-[#DCE8F5] bg-white p-5 text-left transition hover:border-[#1877F2] hover:shadow-sm"
                        key={item.key}
                        onClick={() => changeSection(item.key)}
                      >
                        <span>
                          <span className="block text-lg font-black">{item.label}</span>
                          <span className="mt-2 block text-sm text-[#5B6F8A]">
                            Abrir modulo de {item.label.toLowerCase()}.
                          </span>
                        </span>
                        {Icon ? (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#1877F2] transition group-hover:bg-[#1877F2] group-hover:text-white">
                            <Icon size={26} strokeWidth={2.25} />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </section>
              </>
            ) : null}

            {section === "units" ? (
              <section className="rounded-xl border border-[#DCE8F5] bg-white p-5">
                <ModuleHeader
                  description="Filtra unidades, actualiza placas y aplica bloqueos operativos."
                  title="Unidades y bloqueos"
                />
                <SearchBar
                  onSearch={() => loadDashboard()}
                  placeholder="Buscar bloque, apartamento o unidad"
                  value={unitQuery}
                  onChange={setUnitQuery}
                />
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {units.map((unit) => (
                    <div className="rounded-xl border border-[#DCE8F5] p-4" key={unit.id}>
                      <div className="flex items-start justify-between gap-3">
                        <button className="text-left" onClick={() => setSelectedUnitId(unit.id)}>
                          <p className="text-lg font-black">{unit.display_label}</p>
                          <p className="text-sm text-[#5B6F8A]">
                            {unit.residents} residentes - {unit.contacts} contactos
                          </p>
                        </button>
                        <StatusPill
                          color={unit.is_access_blocked ? "red" : "green"}
                          label={unit.is_access_blocked ? "Bloqueada" : "Habilitada"}
                        />
                      </div>
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        <input
                          className="rounded-lg border border-[#DCE8F5] px-3 py-2 text-sm"
                          defaultValue={unit.car_plate ?? ""}
                          onBlur={(event) => updateUnit(unit, { carPlate: event.target.value })}
                          placeholder="Placa automotor"
                        />
                        <input
                          className="rounded-lg border border-[#DCE8F5] px-3 py-2 text-sm"
                          defaultValue={unit.motorcycle_plate ?? ""}
                          onBlur={(event) => updateUnit(unit, { motorcyclePlate: event.target.value })}
                          placeholder="Placa motocicleta"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`rounded-lg px-4 py-2 text-sm font-black ${
                            unit.is_access_blocked
                              ? "bg-[#E8F7EF] text-[#22A06B]"
                              : "bg-red-50 text-red-700"
                          } disabled:cursor-wait disabled:opacity-70`}
                          disabled={blockingUnitId === unit.id}
                          onClick={() =>
                            updateUnit(
                              unit,
                              {
                                isAccessBlocked: !unit.is_access_blocked,
                                accessBlockReason: unit.is_access_blocked
                                  ? ""
                                  : "Administracion pendiente de pago",
                              },
                              { blocking: true },
                            )
                          }
                        >
                          {blockingUnitId === unit.id
                            ? unit.is_access_blocked
                              ? "Levantando bloqueo..."
                              : "Bloqueando..."
                            : unit.is_access_blocked
                              ? "Levantar bloqueo"
                              : "Bloquear unidad"}
                        </button>
                        <button
                          className="rounded-lg bg-[#EAF4FF] px-4 py-2 text-sm font-black text-[#1877F2] transition hover:bg-[#1877F2] hover:text-white"
                          onClick={() => {
                            setSelectedUnitId(unit.id);
                            setDetailUnitId(unit.id);
                          }}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {section === "residents" ? (
              <section className="grid gap-5">
                <div className="rounded-xl border border-[#DCE8F5] bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <ModuleHeader description="Edita estado y privacidad visible para porteria." title="Residentes" />
                    <button
                      className="primaryButton"
                      onClick={() => openResidentModal(selectedUnitId)}
                      type="button"
                    >
                      Nuevo residente
                    </button>
                  </div>
                  <SearchBar onSearch={() => loadDashboard()} placeholder="Buscar residente, documento o unidad" value={residentQuery} onChange={setResidentQuery} />
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {residents.map((resident) => (
                      <div className="rounded-xl border border-[#DCE8F5] p-4" key={resident.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-black">{resident.full_name}</p>
                            <p className="text-sm text-[#5B6F8A]">{resident.unit_label} - {resident.phone || "sin telefono"}</p>
                          </div>
                          <StatusPill color={resident.is_active ? "green" : "red"} label={resident.is_active ? "Activo" : "Inactivo"} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded-lg bg-[#EAF4FF] px-3 py-2 text-xs font-black text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
                            onClick={() => openResidentModal(resident.unit_id)}
                            type="button"
                          >
                            Modificar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {section === "users" ? (
              <section className="rounded-xl border border-[#DCE8F5] bg-white p-5">
                <ModuleHeader description="Crea, cambia roles y activa o desactiva usuarios." title="Roles y usuarios" />
                <div className="grid gap-3 md:grid-cols-4">
                  <input className="input" onChange={(event) => setNewUsername(event.target.value)} placeholder="Usuario" value={newUsername} />
                  <input className="input" onChange={(event) => setNewPassword(event.target.value)} placeholder="Contrasena" value={newPassword} />
                  <select className="input" onChange={(event) => setNewRole(event.target.value)} value={newRole}>
                    <option value="porter">Porteria</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <button className="primaryButton" onClick={createUser}>Crear Usuario</button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {users.map((user) => (
                    <div className="rounded-xl border border-[#DCE8F5] p-4" key={user.id}>
                      <p className="font-black">{user.username}</p>
                      <p className="text-sm text-[#5B6F8A]">{user.role}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="secondaryButton disabled:cursor-wait disabled:opacity-70"
                          disabled={updatingUserId === user.id}
                          onClick={() =>
                            updateUser(user, { isActive: !user.is_active }, { statusChange: true })
                          }
                        >
                          {updatingUserId === user.id
                            ? user.is_active
                              ? "Desactivando..."
                              : "Activando..."
                            : user.is_active
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                        <button
                          className="rounded-lg bg-[#EAF4FF] px-4 py-2 text-sm font-black text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
                          onClick={() => openUserModal(user)}
                        >
                          Modificar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {section === "messages" ? (
              <section className="rounded-xl border border-[#DCE8F5] bg-white p-5">
                <ModuleHeader description="Envia mensajes por WhatsApp y registra notificaciones push." title="Mensajeria" />
                <ChatPanel
                  chats={chatThreads}
                  hasMoreMessages={chatHasMore}
                  loading={loading}
                  loadingOlderMessages={loadingOlderMessages}
                  messages={chatMessages}
                  messageText={messageText}
                  onChangeMessage={setMessageText}
                  onLoadOlder={loadOlderMessages}
                  onSend={sendMessage}
                  onSelectChat={selectChat}
                  selectedUnitId={selectedUnitId}
                />
              </section>
            ) : null}

            {section === "reports" ? (
              <section className="rounded-xl border border-[#DCE8F5] bg-white p-5">
                <ModuleHeader description="Exporta actividad, unidades y unidades bloqueadas." title="Reportes" />
                <div className="grid gap-4 md:grid-cols-3">
                  <ReportCard label="Actividad operativa" onExport={(format) => exportReport("activity", format)} />
                  <ReportCard label="Listado de unidades" onExport={(format) => exportReport("units", format)} />
                  <ReportCard label="Unidades bloqueadas" onExport={(format) => exportReport("blocked_units", format)} />
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
    {detailUnit ? (
      <UnitDetailModal
        onClose={() => setDetailUnitId("")}
        onOpenMessages={() => {
          setSelectedUnitId(detailUnit.id);
          changeSection("messages");
          setDetailUnitId("");
          void loadChats(detailUnit.id);
        }}
        onOpenResidents={() => {
          setSelectedUnitId(detailUnit.id);
          changeSection("residents");
          setDetailUnitId("");
        }}
        unit={detailUnit}
      />
    ) : null}
    {residentModalOpen ? (
      <ResidentFormModal
        existingResident={selectedUnitResident}
        loading={loading}
        onChangeUnit={(unitId) => openResidentModal(unitId)}
        onClose={closeResidentModal}
        onSubmit={createResident}
        residentCarPlate={residentCarPlate}
        residentDocument={residentDocument}
        residentEmail={residentEmail}
        residentName={residentName}
        residentPhone={residentPhone}
        residentMotorcyclePlate={residentMotorcyclePlate}
        residentShowNameToPorter={residentShowNameToPorter}
        residentShowPhoneToPorter={residentShowPhoneToPorter}
        selectedUnit={residentModalUnit}
        selectedUnitId={residentUnitId}
        setResidentCarPlate={setResidentCarPlate}
        setResidentDocument={setResidentDocument}
        setResidentEmail={setResidentEmail}
        setResidentName={setResidentName}
        setResidentPhone={setResidentPhone}
        setResidentMotorcyclePlate={setResidentMotorcyclePlate}
        setResidentShowNameToPorter={setResidentShowNameToPorter}
        setResidentShowPhoneToPorter={setResidentShowPhoneToPorter}
        units={units}
      />
    ) : null}
    {userModal ? (
      <UserEditModal
        editPassword={editPassword}
        editRole={editRole}
        editUsername={editUsername}
        loading={loading}
        onClose={() => setUserModalId("")}
        onSave={saveUserModal}
        onToggleStatus={() =>
          updateUser(userModal, { isActive: !userModal.is_active }, { statusChange: true })
        }
        setEditPassword={setEditPassword}
        setEditRole={setEditRole}
        setEditUsername={setEditUsername}
        updatingUserId={updatingUserId}
        user={userModal}
      />
    ) : null}
    </>
  );
}

function UnitDetailModal({
  onClose,
  onOpenMessages,
  onOpenResidents,
  unit,
}: {
  onClose: () => void;
  onOpenMessages: () => void;
  onOpenResidents: () => void;
  unit: Unit;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#123047]/35 px-4 py-6">
      <section className="w-full max-w-xl rounded-2xl border border-[#DCE8F5] bg-white p-6 text-[#123047] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#1877F2]">
              Detalle de unidad
            </p>
            <h3 className="mt-1 text-3xl font-black">{unit.display_label}</h3>
            <p className="mt-1 text-sm font-medium text-[#5B6F8A]">
              Informacion administrativa y operativa.
            </p>
          </div>
          <button
            aria-label="Cerrar detalle"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4FF] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <UnitDetailItem label="Estado" value={unit.is_access_blocked ? "Bloqueada" : "Habilitada"} />
          <UnitDetailItem label="Residentes" value={`${unit.residents}`} />
          <UnitDetailItem label="Contactos" value={`${unit.contacts}`} />
          <UnitDetailItem label="Placa automotor" value={unit.car_plate || "Sin registrar"} />
          <UnitDetailItem label="Placa motocicleta" value={unit.motorcycle_plate || "Sin registrar"} />
          <UnitDetailItem label="Motivo de bloqueo" value={unit.access_block_reason || "No aplica"} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="primaryButton" onClick={onOpenResidents} type="button">
            Ver residentes
          </button>
          <button className="secondaryButton" onClick={onOpenMessages} type="button">
            Enviar mensaje
          </button>
          <button className="secondaryButton" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      </section>
    </div>
  );
}

function UnitDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DCE8F5] bg-[#F7FAFD] p-4">
      <p className="text-xs font-black uppercase text-[#5B6F8A]">{label}</p>
      <p className="mt-2 text-base font-black">{value}</p>
    </div>
  );
}

function formatShortTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ResidentFormModal({
  existingResident,
  loading,
  onChangeUnit,
  onClose,
  onSubmit,
  residentCarPlate,
  residentDocument,
  residentEmail,
  residentName,
  residentPhone,
  residentMotorcyclePlate,
  residentShowNameToPorter,
  residentShowPhoneToPorter,
  selectedUnit,
  selectedUnitId,
  setResidentCarPlate,
  setResidentDocument,
  setResidentEmail,
  setResidentName,
  setResidentPhone,
  setResidentMotorcyclePlate,
  setResidentShowNameToPorter,
  setResidentShowPhoneToPorter,
  units,
}: {
  existingResident: Resident | null;
  loading: boolean;
  onChangeUnit: (unitId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  residentCarPlate: string;
  residentDocument: string;
  residentEmail: string;
  residentName: string;
  residentPhone: string;
  residentMotorcyclePlate: string;
  residentShowNameToPorter: boolean;
  residentShowPhoneToPorter: boolean;
  selectedUnit: Unit | null;
  selectedUnitId: string;
  setResidentCarPlate: (value: string) => void;
  setResidentDocument: (value: string) => void;
  setResidentEmail: (value: string) => void;
  setResidentName: (value: string) => void;
  setResidentPhone: (value: string) => void;
  setResidentMotorcyclePlate: (value: string) => void;
  setResidentShowNameToPorter: (value: boolean) => void;
  setResidentShowPhoneToPorter: (value: boolean) => void;
  units: Unit[];
}) {
  const [unitSearch, setUnitSearch] = useState(selectedUnit?.display_label ?? "");
  const [unitOptionsOpen, setUnitOptionsOpen] = useState(false);
  const filteredUnits = units
    .filter((unit) =>
      unit.display_label.toLowerCase().includes(unitSearch.trim().toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#123047]/35 px-4 py-6">
      <section className="w-full max-w-2xl rounded-2xl border border-[#DCE8F5] bg-white p-6 text-[#123047] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#1877F2]">
              {existingResident ? "Modificar residente" : "Nuevo residente"}
            </p>
            <h3 className="mt-1 text-3xl font-black">
              {selectedUnit?.display_label ?? "Selecciona una unidad"}
            </h3>
            <p className="mt-1 text-sm font-medium text-[#5B6F8A]">
              {existingResident
                ? "Esta unidad ya tiene residente. Actualiza la informacion registrada."
                : "Selecciona bloque y apartamento antes de crear el residente."}
            </p>
          </div>
          <button
            aria-label="Cerrar residente"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4FF] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <label className="relative grid gap-2 text-sm font-black md:col-span-2">
            Bloque y apartamento
            <input
              className="input"
              onChange={(event) => {
                setUnitSearch(event.target.value);
                setUnitOptionsOpen(true);
              }}
              onFocus={() => setUnitOptionsOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const firstUnit = filteredUnits[0];
                  if (firstUnit) {
                    setUnitSearch(firstUnit.display_label);
                    setUnitOptionsOpen(false);
                    onChangeUnit(firstUnit.id);
                  }
                }
              }}
              placeholder="Escribe bloque o apartamento"
              value={unitSearch}
            />
            {unitOptionsOpen && unitSearch.trim() && filteredUnits.length > 0 ? (
              <div className="absolute left-0 right-0 top-[78px] z-10 overflow-hidden rounded-xl border border-[#DCE8F5] bg-white shadow-xl">
                {filteredUnits.map((unit) => (
                  <button
                    className={`block w-full px-4 py-3 text-left text-sm font-black hover:bg-[#EAF4FF] ${
                      selectedUnitId === unit.id ? "bg-[#EAF4FF] text-[#1877F2]" : ""
                    }`}
                    key={unit.id}
                    onClick={() => {
                      setUnitSearch(unit.display_label);
                      setUnitOptionsOpen(false);
                      onChangeUnit(unit.id);
                    }}
                    type="button"
                  >
                    {unit.display_label}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <input className="input" onChange={(event) => setResidentName(event.target.value)} placeholder="Nombre completo" value={residentName} />
          <input className="input" onChange={(event) => setResidentDocument(event.target.value)} placeholder="Documento" value={residentDocument} />
          <input className="input" onChange={(event) => setResidentPhone(event.target.value)} placeholder="Telefono / WhatsApp" value={residentPhone} />
          <input className="input" onChange={(event) => setResidentEmail(event.target.value)} placeholder="Correo" value={residentEmail} />
          <input className="input" onChange={(event) => setResidentCarPlate(event.target.value)} placeholder="Placa de carro" value={residentCarPlate} />
          <input className="input" onChange={(event) => setResidentMotorcyclePlate(event.target.value)} placeholder="Placa de moto" value={residentMotorcyclePlate} />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <ToggleButton active={residentShowNameToPorter} label={residentShowNameToPorter ? "Nombre visible porteria" : "Nombre no visible porteria"} onClick={() => setResidentShowNameToPorter(!residentShowNameToPorter)} />
            <ToggleButton active={residentShowPhoneToPorter} label={residentShowPhoneToPorter ? "Telefono visible porteria" : "Telefono no visible porteria"} onClick={() => setResidentShowPhoneToPorter(!residentShowPhoneToPorter)} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="primaryButton" disabled={loading || !selectedUnitId} onClick={onSubmit} type="button">
            {existingResident ? "Actualizar residente" : "Crear residente"}
          </button>
          <button className="secondaryButton" onClick={onClose} type="button">
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}

function UserEditModal({
  editPassword,
  editRole,
  editUsername,
  loading,
  onClose,
  onSave,
  onToggleStatus,
  setEditPassword,
  setEditRole,
  setEditUsername,
  updatingUserId,
  user,
}: {
  editPassword: string;
  editRole: string;
  editUsername: string;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onToggleStatus: () => void;
  setEditPassword: (value: string) => void;
  setEditRole: (value: string) => void;
  setEditUsername: (value: string) => void;
  updatingUserId: string;
  user: User;
}) {
  const isChangingStatus = updatingUserId === user.id;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#123047]/35 px-4 py-6">
      <section className="w-full max-w-xl rounded-2xl border border-[#DCE8F5] bg-white p-6 text-[#123047] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#1877F2]">
              Modificar usuario
            </p>
            <h3 className="mt-1 text-3xl font-black">{user.username}</h3>
            <p className="mt-1 text-sm font-medium text-[#5B6F8A]">
              Cambia usuario, rol, contrasena o estado.
            </p>
          </div>
          <button
            aria-label="Cerrar usuario"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4FF] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <input className="input" onChange={(event) => setEditUsername(event.target.value)} placeholder="Usuario" value={editUsername} />
          <input className="input" onChange={(event) => setEditPassword(event.target.value)} placeholder="Nueva contrasena opcional" type="password" value={editPassword} />
          <select className="input" onChange={(event) => setEditRole(event.target.value)} value={editRole}>
            <option value="porter">Porteria</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="primaryButton" disabled={loading} onClick={onSave} type="button">
            Guardar cambios
          </button>
          <button
            className="secondaryButton disabled:cursor-wait disabled:opacity-70"
            disabled={isChangingStatus}
            onClick={onToggleStatus}
            type="button"
          >
            {isChangingStatus
              ? user.is_active
                ? "Desactivando..."
                : "Activando..."
              : user.is_active
                ? "Desactivar"
                : "Activar"}
          </button>
          <button className="secondaryButton" onClick={onClose} type="button">
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}

function ChatPanel({
  chats,
  hasMoreMessages,
  loading,
  loadingOlderMessages,
  messages,
  messageText,
  onChangeMessage,
  onLoadOlder,
  onSelectChat,
  onSend,
  selectedUnitId,
}: {
  chats: ChatThread[];
  hasMoreMessages: boolean;
  loading: boolean;
  loadingOlderMessages: boolean;
  messages: ChatMessage[];
  messageText: string;
  onChangeMessage: (value: string) => void;
  onLoadOlder: () => void;
  onSelectChat: (unitId: string) => void;
  onSend: () => void;
  selectedUnitId: string;
}) {
  const [chatSearch, setChatSearch] = useState("");
  const selectedChat = chats.find((chat) => chat.unitId === selectedUnitId) ?? chats[0] ?? null;
  const normalizedChatSearch = chatSearch.trim().toLowerCase();
  const normalizedChatSearchDigits = normalizedChatSearch.replace(/\D/g, "");
  const visibleChats = chats.filter((chat) => {
    if (!normalizedChatSearch) {
      return true;
    }

    const searchableText = [
      chat.unitLabel,
      chat.residentName,
      chat.phone,
      chat.lastMessage,
    ]
      .join(" ")
      .toLowerCase();
    const searchableDigits = [chat.phone, chat.unitLabel].join(" ").replace(/\D/g, "");

    return (
      searchableText.includes(normalizedChatSearch) ||
      Boolean(normalizedChatSearchDigits && searchableDigits.includes(normalizedChatSearchDigits))
    );
  });

  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#DCE8F5] bg-white xl:grid-cols-[360px_1fr]">
      <aside className="border-b border-[#DCE8F5] bg-white xl:border-b-0 xl:border-r">
        <div className="border-b border-[#DCE8F5] p-4">
          <p className="text-xs font-black uppercase text-[#1877F2]">Historial</p>
          <h3 className="text-2xl font-black">Chats recientes</h3>
          <p className="text-sm font-medium text-[#5B6F8A]">
            Ultimas conversaciones por unidad.
          </p>
          <label className="mt-4 flex items-center gap-2 rounded-xl border border-[#DCE8F5] bg-white px-3 py-2 text-[#123047] transition focus-within:border-[#1877F2] focus-within:ring-2 focus-within:ring-[#EAF4FF]">
            <Search className="shrink-0 text-[#5B6F8A]" size={18} strokeWidth={2.5} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#8EA0B8]"
              onChange={(event) => setChatSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (visibleChats[0]) {
                    onSelectChat(visibleChats[0].unitId);
                  }
                }
              }}
              placeholder="Buscar chat"
              value={chatSearch}
            />
          </label>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-3">
          {visibleChats.length === 0 ? (
            <div className="rounded-xl bg-[#F7FAFD] px-4 py-5 text-center">
              <p className="text-sm font-black text-[#123047]">Sin conversaciones encontradas</p>
              <p className="mt-1 text-xs font-medium text-[#5B6F8A]">
                Prueba con otra unidad, residente o telefono.
              </p>
            </div>
          ) : (
            visibleChats.map((chat) => (
            <button
              className={`mb-2 flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                selectedUnitId === chat.unitId
                  ? "bg-[#EAF4FF] ring-1 ring-[#1877F2]"
                  : "hover:bg-[#F7FAFD]"
              }`}
              key={chat.unitId}
              onClick={() => onSelectChat(chat.unitId)}
              type="button"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-sm font-black text-white">
                {chat.unitLabel.split(" ").at(-1)?.slice(0, 2).toUpperCase() ?? "U"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black">{chat.unitLabel}</span>
                  <span className="shrink-0 text-[11px] font-bold text-[#5B6F8A]">
                    {formatShortTime(chat.lastAt)}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs font-bold text-[#5B6F8A]">
                  {chat.residentName}
                </span>
                <span className="mt-1 block truncate text-xs font-medium text-[#5B6F8A]">
                  {chat.lastMessage}
                </span>
              </span>
            </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col bg-[#EAF4FF]">
        <div className="flex items-center justify-between gap-4 border-b border-[#DCE8F5] bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#1877F2]">
              {selectedChat?.unitLabel ?? "Sin chat seleccionado"}
            </p>
            <h3 className="truncate text-2xl font-black">
              {selectedChat?.residentName ?? "Selecciona un chat"}
            </h3>
            <p className="text-sm font-medium text-[#5B6F8A]">
              {selectedChat?.phone || "Sin telefono registrado"}
            </p>
          </div>
          <span className="rounded-full bg-[#E8F7EF] px-3 py-1 text-xs font-black text-[#22A06B]">
            WhatsApp
          </span>
        </div>

        <div
          className="flex-1 overflow-y-auto p-5"
          onScroll={(event) => {
            if (event.currentTarget.scrollTop < 12) {
              onLoadOlder();
            }
          }}
        >
          <div className="mb-4 text-center">
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-black text-[#5B6F8A]">
              Ultimos 25 mensajes
            </span>
          </div>
          {hasMoreMessages ? (
            <div className="mb-4 text-center">
              <button
                className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#1877F2]"
                disabled={loadingOlderMessages}
                onClick={onLoadOlder}
                type="button"
              >
                {loadingOlderMessages ? "Cargando..." : "Cargar anteriores"}
              </button>
            </div>
          ) : null}
          <div className="grid gap-3">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                <p className="text-sm font-medium text-[#123047]">
                  Aun no hay mensajes registrados para este chat.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.direction === "outbound"
                      ? "ml-auto rounded-br-sm bg-[#DFF7E8]"
                      : "rounded-bl-sm bg-white"
                  }`}
                  key={message.id}
                >
                  <p className="whitespace-pre-wrap text-sm font-medium text-[#123047]">
                    {message.body}
                  </p>
                  <p className={`mt-1 text-right text-[11px] font-bold ${
                    message.direction === "outbound" ? "text-[#22A06B]" : "text-[#5B6F8A]"
                  }`}>
                    {formatShortTime(message.sentAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#DCE8F5] bg-white p-4 md:grid-cols-[1fr_auto]">
          <textarea
            className="min-h-20 resize-none rounded-xl border border-[#DCE8F5] px-4 py-3 text-sm font-medium outline-none focus:border-[#1877F2]"
            onChange={(event) => onChangeMessage(event.target.value)}
            placeholder="Escribe un mensaje"
            value={messageText}
          />
          <button
            className="primaryButton flex items-center justify-center gap-2"
            disabled={loading || !selectedUnitId || !messageText.trim()}
            onClick={onSend}
            type="button"
          >
            <Send size={18} strokeWidth={2.5} />
            Enviar
          </button>
        </div>
      </section>
    </div>
  );
}

function UserProfileMenu({
  isOpen,
  onClose,
  onLogout,
  onToggle,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onToggle: () => void;
  user: AuthUser;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const initials = user.username
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
  const roleLabel = user.role === "superadmin" ? "Superadmin" : "Admin";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;

      if (target instanceof Node && menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        className="flex min-w-56 items-center justify-between gap-3 rounded-full border border-[#DCE8F5] bg-white px-3 py-2 shadow-sm transition hover:border-[#1877F2] hover:bg-[#EAF4FF]"
        onClick={onToggle}
        type="button"
      >
        <span className="flex items-center gap-3 text-left">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-sm font-black text-white">
            {initials}
          </span>
          <span>
            <span className="block text-sm font-black text-[#123047]">
              {user.username}
            </span>
            <span className="block text-xs font-bold text-[#5B6F8A]">
              {roleLabel}
            </span>
          </span>
        </span>
        <span className="text-xs font-black text-[#1877F2]">{isOpen ? "^" : "v"}</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-[#DCE8F5] bg-white p-2 shadow-xl">
          <div className="border-b border-[#DCE8F5] px-3 py-3">
            <p className="text-xs font-black uppercase text-[#1877F2]">
              Sesion activa
            </p>
            <p className="mt-1 text-sm font-black text-[#123047]">{user.username}</p>
            <p className="text-xs font-bold text-[#5B6F8A]">{roleLabel}</p>
          </div>
          <button
            className="mt-2 w-full rounded-lg px-3 py-3 text-left text-sm font-black text-red-700 hover:bg-red-50"
            onClick={onLogout}
            type="button"
          >
            Cerrar sesion
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AdminLogin({
  loading,
  notice,
  onLogin,
  password,
  setPassword,
  setUsername,
  username,
}: {
  loading: boolean;
  notice: string;
  onLogin: () => void;
  password: string;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  username: string;
}) {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-[#123047]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#1877F2]">
            Citofonia residencial
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight">
            Arcadas de San Isidro
          </h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#5B6F8A]">
            Acceso administrativo para gestionar residentes, unidades, bloqueos,
            mensajes y reportes.
          </p>
        </div>

        <form
          className="mt-10 grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin();
          }}
        >
          <label className="grid gap-2 text-sm font-black">
            Usuario
            <input
              autoComplete="username"
              className="input h-[52px]"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ingresa tu usuario"
              value={username}
            />
          </label>

          <label className="grid gap-2 text-sm font-black">
            Contraseña
            <input
              autoComplete="current-password"
              className="input h-[52px]"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              type="password"
              value={password}
            />
          </label>

          <button className="primaryButton h-[52px]" disabled={loading} type="submit">
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>

        {notice ? (
          <p className="mt-5 rounded-lg bg-[#EAF4FF] px-4 py-3 text-center text-sm font-bold text-[#5B6F8A]">
            {notice}
          </p>
        ) : null}

        <div className="mt-12 rounded-xl bg-[#E8F7EF] px-4 py-3 text-center">
          <p className="text-xs font-black uppercase text-[#22A06B]">
            Conexion segura
          </p>
          <p className="mt-1 text-xs font-medium text-[#5B6F8A]">
            Panel exclusivo para Admin y Superadmin.
          </p>
        </div>
      </section>
    </main>
  );
}

function ModuleHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-black uppercase text-[#1877F2]">Administracion</p>
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="text-sm text-[#5B6F8A]">{description}</p>
    </div>
  );
}

function SearchBar({
  onChange,
  onSearch,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
  value: string;
}) {
  return (
    <form
      className="grid gap-2 md:grid-cols-[1fr_120px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <input className="input" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      <button className="primaryButton" type="submit">Buscar</button>
    </form>
  );
}

function StatusPill({ color, label }: { color: "green" | "red"; label: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${color === "green" ? "bg-[#E8F7EF] text-[#22A06B]" : "bg-red-50 text-red-700"}`}>
      {label}
    </span>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`rounded-lg px-3 py-2 text-xs font-black ${active ? "bg-[#E8F7EF] text-[#22A06B]" : "bg-red-50 text-red-700"}`} onClick={onClick}>
      {label}
    </button>
  );
}

function ReportCard({
  label,
  onExport,
}: {
  label: string;
  onExport: (format: "csv" | "xlsx" | "pdf") => void;
}) {
  return (
    <div className="rounded-xl border border-[#DCE8F5] p-4">
      <p className="font-black">{label}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="secondaryButton" onClick={() => onExport("csv")}>CSV</button>
        <button className="secondaryButton" onClick={() => onExport("xlsx")}>Excel</button>
        <button className="secondaryButton" onClick={() => onExport("pdf")}>PDF</button>
      </div>
    </div>
  );
}
