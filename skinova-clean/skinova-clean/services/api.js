// api.js  —  Drop this in your React Native project (e.g. src/api/api.js)
// Replace BASE_URL with your backend IP when testing on device

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.100:8000/api"; // ← change to your machine's IP

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getToken() {
  return await AsyncStorage.getItem("token");
}

async function authHeaders(extra = {}) {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function handleResponse(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Request failed");
  return json;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  await AsyncStorage.setItem("token", data.token);
  return data;
}

export async function register(payload) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ─── FACE / SKIN ──────────────────────────────────────────────────────────────

/**
 * analyzeFace(imageUri)
 * imageUri: local file URI from camera/library (e.g. "file:///...")
 */
export async function analyzeFace(imageUri) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append("image", {
    uri: imageUri,
    name: "face.jpg",
    type: "image/jpeg",
  });

  const res = await fetch(`${BASE_URL}/face/analyze`, {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse(res);
}

export async function getFaceLogs() {
  const res = await fetch(`${BASE_URL}/face/logs`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

// ─── FOOD ─────────────────────────────────────────────────────────────────────

/**
 * analyzeFood({ barcode?, text?, imageUri? })
 * Pass ONE of the three fields.
 */
export async function analyzeFood({ barcode, text, imageUri }) {
  const headers = await authHeaders();
  const form = new FormData();
  if (barcode) form.append("barcode", barcode);
  if (text) form.append("text", text);
  if (imageUri) {
    form.append("image", { uri: imageUri, name: "food.jpg", type: "image/jpeg" });
  }

  const res = await fetch(`${BASE_URL}/food/analyze`, {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse(res);
}

export async function getFoodLogs() {
  const res = await fetch(`${BASE_URL}/food/logs`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

// ─── PRODUCT ──────────────────────────────────────────────────────────────────

/**
 * analyzeProduct({ barcode?, text?, imageUri? })
 */
export async function analyzeProduct({ barcode, text, imageUri }) {
  const headers = await authHeaders({ "Content-Type": "application/json" });

  // image goes as multipart, otherwise JSON
  if (imageUri) {
    delete headers["Content-Type"];
    const form = new FormData();
    if (barcode) form.append("barcode", barcode);
    if (text) form.append("text", text);
    form.append("image", { uri: imageUri, name: "product.jpg", type: "image/jpeg" });
    const res = await fetch(`${BASE_URL}/product/analyze`, {
      method: "POST",
      headers: await authHeaders(),
      body: form,
    });
    return handleResponse(res);
  }

  const res = await fetch(`${BASE_URL}/product/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify({ barcode, text }),
  });
  return handleResponse(res);
}

export async function getProductLogs() {
  const res = await fetch(`${BASE_URL}/product/logs`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

// ─── CYCLE / MENSTRUAL ────────────────────────────────────────────────────────

/**
 * predictCycle(payload)
 * payload: {
 *   last_period_start: "2026-02-20",
 *   cycle_length: 28,
 *   period_duration: 5,
 *   start_date: "2026-02-20",
 *   end_date: "2026-03-20",
 *   symptoms: { pain: 0.1, mood: 0.7, flow: 0.0, stress: 0.2 }
 * }
 */
export async function predictCycle(payload) {
  const res = await fetch(`${BASE_URL}/cycle/predict`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ─── FORECAST / TFT ───────────────────────────────────────────────────────────

/**
 * getDailyForecast(startDate, endDate)
 * Returns per-day risk scores from TFT model.
 */
export async function getDailyForecast(startDate, endDate) {
  const res = await fetch(`${BASE_URL}/forecast/daily-data`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ start_date: startDate, end_date: endDate }),
  });
  return handleResponse(res);
}

/**
 * getDayReport(date)  e.g. "2026-03-28"
 * Returns full day report: skin + food + cycle + products + risk score
 */
export async function getDayReport(date) {
  const res = await fetch(`${BASE_URL}/forecast/day-report`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ date }),
  });
  return handleResponse(res);
}

// ─── TFT (manual trigger) ────────────────────────────────────────────────────

/** Trigger TFT model update — call after new logs are saved */
export async function updateTFT() {
  const res = await fetch(`${BASE_URL}/tft/update`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

export async function getTFTReport() {
  const res = await fetch(`${BASE_URL}/tft/report`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export async function getDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard`, {
    headers: await authHeaders(),
  });
  return handleResponse(res);
}