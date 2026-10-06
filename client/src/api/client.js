import axios from "axios";
import { API_URL } from "../lib/config";

export const TOKEN_KEY = "token";

const api = axios.create({ baseURL: API_URL });

// Attach the JWT to every request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
