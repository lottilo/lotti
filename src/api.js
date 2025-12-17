const API_BASE = "https://lotti-etcgare8gzdrhfes.italynorth-01.azurewebsites.net";

export async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // ако има HTML/празен отговор, да не гърми
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
