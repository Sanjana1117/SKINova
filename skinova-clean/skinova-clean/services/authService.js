import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.237.1.60:8000";

async function handleResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.detail || json.message || "Request failed");
    error.response = { data: json };
    throw error;
  }
  return json;
}

// 🔐 helper to get auth headers
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("skinova_token");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ✅ LOGIN
export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse(res);

  // 🔥 STORE TOKEN
  if (data.access_token) {
    await AsyncStorage.setItem("skinova_token", data.access_token);
  }

  return data;
}

// ✅ SIGNUP
export async function signupUser(userData) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  return handleResponse(res);
}

// 🔥 PROTECTED API EXAMPLE
export async function analyzeFace(data) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${BASE_URL}/api/face/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  return handleResponse(res);
}