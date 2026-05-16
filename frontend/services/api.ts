import axios from "axios";
import Constants from "expo-constants";

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