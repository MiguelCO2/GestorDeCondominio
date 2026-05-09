import axios from "axios";

export const API_BASE_URL = "http://192.168.0.195:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
