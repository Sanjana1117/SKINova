// services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

export const BASE_URL = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === "web") return "http://localhost:8000";
  return "http://localhost:8000"; // Default for mobile
})();

const API = axios.create({ baseURL: `${BASE_URL}/api` });

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("skinova_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default API;

export async function authFetch(path, options = {}) {
  const token = await AsyncStorage.getItem("skinova_token");
  const headers = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.detail || "Request failed"), { response: { data: json } });
  return json;
}



