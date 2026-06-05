import axios from "axios";
import Constants from "expo-constants";
import { clearSession, getSession, saveSession } from "./session.service";

function getExpoHostIp() {
  const expoConfig = Constants.expoConfig as any;
  const manifest = Constants.manifest as any;

  const hostUri =
    expoConfig?.hostUri ||
    manifest?.debuggerHost ||
    manifest?.hostUri ||
    "";

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
}

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  const hostIp = getExpoHostIp();

  if (hostIp) {
    return `http://${hostIp}:8000/api`;
  }

  return "http://127.0.0.1:8000/api";
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session?.access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${session.access}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isUnauthorized = error?.response?.status === 401;
    const alreadyRetried = originalRequest?._retry;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh/");

    if (!isUnauthorized || alreadyRetried || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const session = await getSession();

    if (!session?.refresh) {
      await clearSession();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh: session.refresh,
      });

      const newAccess = refreshResponse.data.access;

      await saveSession({
        access: newAccess,
        refresh: session.refresh,
        user: session.user,
      });

      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;

      return api(originalRequest);
    } catch (refreshError) {
      await clearSession();
      delete api.defaults.headers.common.Authorization;
      return Promise.reject(refreshError);
    }
  }
);