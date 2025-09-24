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

export function fetchWarrantyList({ status='soon', days=30, q='', page=1, pageSize=10 } = {}){
  const API_BASE = 'http://localhost:3000'; // หรือ '' ถ้าใช้ Vite proxy
  const params = new URLSearchParams({ status, days, q, page, pageSize });
  return getJSON(`${API_BASE}/api/warranty/list?${params.toString()}`);
}

export function fetchEquipments({ q = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ q, page, pageSize });
  return getJSON(`${API_BASE}/api/equipments?${params.toString()}`);
}

export function fetchEquipmentById(id) {
  return getJSON(`${API_BASE}/api/equipments/${id}`);
}

export async function removeEquipment(id) {
  const res = await fetch(`${API_BASE}/api/equipments/${id}`, { method: 'DELETE' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Delete failed');
  return data; // { ok:true }
}

export const fetchStats = () => getJSON(`${API_BASE}/api/stats`);

export const fetchLatestEquipments = (limit = 6) =>
  getJSON(`${API_BASE}/api/equipments/latest?limit=${limit}`);

export const fetchExpiring = () => getJSON(`${API_BASE}/api/warranty/expiring`);

export const fetchBrands = () => getJSON(`${API_BASE}/api/brands`);

export const fetchTypes = () => getJSON(`${API_BASE}/api/types`);

export const createEquipment = (payload) => postJSON(`${API_BASE}/api/equipments`, payload);




