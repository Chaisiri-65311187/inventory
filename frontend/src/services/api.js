const API_BASE = 'http://localhost:3000';

async function getJSON(url) {
  const res = await fetch(url);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export async function login(username, password) {
  return postJSON(`${API_BASE}/api/login`, {
    username: String(username || '').trim(),
    password: String(password || '').trim()
  });
}

export const fetchStats = () => getJSON(`${API_BASE}/api/stats`);

export const fetchLatestEquipments = (limit = 6) =>
  getJSON(`${API_BASE}/api/equipments/latest?limit=${limit}`);

export const fetchExpiring = () =>
  getJSON(`${API_BASE}/api/warranty/expiring`);

export const fetchBrands = () => getJSON(`${API_BASE}/api/brands`);

export const fetchTypes = () => getJSON(`${API_BASE}/api/types`);

export const createEquipment = (payload) => postJSON(`${API_BASE}/api/equipments`, payload);