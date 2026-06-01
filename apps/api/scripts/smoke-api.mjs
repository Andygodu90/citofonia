const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${data.error ?? ""}`);
  }

  return data;
}

async function login(username, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!data.token) {
    throw new Error(`Login without token for ${username}`);
  }

  return data.token;
}

const adminToken = await login("admin", "Admin123*");
const porterToken = await login("porteria", "Porteria123*");
const residentToken = await login("residente", "Residente123*");

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const summary = await request("/api/admin/summary", {
  headers: auth(adminToken),
});
const reports = await request("/api/admin/reports", {
  headers: auth(adminToken),
});
const units = await request("/api/porter/units?query=31%201A", {
  headers: auth(porterToken),
});
const resident = await request("/api/resident/dashboard", {
  headers: auth(residentToken),
});
const smokeUser = await request("/api/admin/users", {
  method: "POST",
  headers: auth(adminToken),
  body: JSON.stringify({
    username: "smoke_porteria",
    password: "Smoke123*",
    role: "porter",
  }),
});
const disabledSmokeUser = await request(`/api/admin/users/${smokeUser.user.id}`, {
  method: "PATCH",
  headers: auth(adminToken),
  body: JSON.stringify({ isActive: false }),
});
const enabledSmokeUser = await request(`/api/admin/users/${smokeUser.user.id}`, {
  method: "PATCH",
  headers: auth(adminToken),
  body: JSON.stringify({ isActive: true }),
});

if (!summary.summary || !Array.isArray(reports.rows)) {
  throw new Error("Admin endpoints returned unexpected payloads");
}

if (!Array.isArray(units.units) || units.units.length === 0) {
  throw new Error("Porter unit search did not return test unit");
}

if (!resident.resident?.unitLabel) {
  throw new Error("Resident dashboard did not return unit");
}

if (disabledSmokeUser.user.is_active !== false || enabledSmokeUser.user.is_active !== true) {
  throw new Error("Admin user activation toggle failed");
}

console.table({
  baseUrl,
  adminUnits: summary.summary.units,
  reportRows: reports.rows.length,
  porterUnit: units.units[0].displayLabel,
  residentUnit: resident.resident.unitLabel,
  adminToggle: "ok",
});
