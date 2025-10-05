// frontend/src/services/api.js

const API_BASE = 'http://localhost:3000';

// ------------------ utils ------------------
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

// ------------------ auth ------------------
export async function login(username, password) {
  return postJSON(`${API_BASE}/api/login`, {
    username: String(username || '').trim(),
    password: String(password || '').trim(),
  });
}

// ------------------ warranty ------------------
export function fetchWarrantyList({
  status = 'soon',
  days = 30,
  q = '',
  page = 1,
  pageSize = 10,
} = {}) {
  const params = new URLSearchParams({ status, days, q, page, pageSize });
  return getJSON(`${API_BASE}/api/warranty/list?${params.toString()}`);
}

export const fetchExpiring = () => getJSON(`${API_BASE}/api/warranty/expiring`);

// ------------------ equipments ------------------
export function fetchEquipments({ q = '', page = 1, pageSize = 10 } = {}) {
  const params = new URLSearchParams({ q, page, pageSize });
  return getJSON(`${API_BASE}/api/equipments?${params.toString()}`);
}

export function fetchEquipmentById(id) {
  return getJSON(`${API_BASE}/api/equipments/${id}`);
}

export function fetchEquipmentFull(id) {
  return getJSON(`${API_BASE}/api/equipments/${id}/full`);
}

export async function removeEquipment(id) {
  const res = await fetch(`${API_BASE}/api/equipments/${id}`, { method: 'DELETE' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Delete failed');
  return data; // { ok:true }
}

// ✅ เพิ่มอุปกรณ์ (รองรับ JSON และ FormData)
export async function createEquipment(payload, isFormData = false) {
  const res = await fetch(`${API_BASE}/api/equipments`, {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Create failed');
  return data;
}

// ✅ แก้ไขอุปกรณ์ (รองรับ JSON และ FormData)
export async function updateEquipment(id, payload, isFormData = false) {
  const res = await fetch(`${API_BASE}/api/equipments/${id}`, {
    method: 'PUT',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Update failed');
  return data;
}

// ------------------ brands ------------------
export const fetchBrands = () => getJSON(`${API_BASE}/api/brands`);

export const createBrand = (payload) =>
  postJSON(`${API_BASE}/api/brands`, payload);

export async function updateBrand(id, payload) {
  const res = await fetch(`${API_BASE}/api/brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Update failed');
  return data;
}

export async function removeBrand(id) {
  const res = await fetch(`${API_BASE}/api/brands/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Delete failed');
  return data;
}

// ------------------ types ------------------
export const fetchTypes = () => getJSON(`${API_BASE}/api/types`);

export const createType = (payload) =>
  postJSON(`${API_BASE}/api/types`, payload);

export async function updateType(id, payload) {
  const res = await fetch(`${API_BASE}/api/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Update failed');
  return data;
}

export async function removeType(id) {
  const res = await fetch(`${API_BASE}/api/types/${id}`, { method: 'DELETE' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || 'Delete failed');
  return data;
}

// ------------------ dashboard ------------------
export const fetchStats = () => getJSON(`${API_BASE}/api/stats`);
export const fetchLatestEquipments = (limit = 6) =>
  getJSON(`${API_BASE}/api/equipments/latest?limit=${limit}`);
