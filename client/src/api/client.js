import axios from "axios";
import { API_URL } from "../lib/config";

export const TOKEN_KEY = "token";
export const SESSION_EXPIRED_EVENT = "auth:expired";

const api = axios.create({ baseURL: API_URL });

// Attach the JWT to every request when the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on an authenticated request means the session is gone
// (expired, or the password changed elsewhere). AuthContext listens and logs out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: error.response.data?.message }));
    }
    return Promise.reject(error);
  }
);

export default api;
