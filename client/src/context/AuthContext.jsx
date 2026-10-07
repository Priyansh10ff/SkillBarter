/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api, { SESSION_EXPIRED_EVENT, TOKEN_KEY } from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load
  useEffect(() => {
    const restore = async () => {
      if (localStorage.getItem(TOKEN_KEY)) {
        try {
          const { data } = await api.get("/api/users/me");
          setUser(data);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Session ended on the server (expired token, password changed elsewhere)
  useEffect(() => {
    const onExpired = (e) => {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      logout();
      toast.error(e.detail || "Your session ended. Log in again.");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  // Stores a session returned by login, sign-up or a password change
  const loginWithToken = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/api/auth/login", { email, password });
      loginWithToken(data.token, data.user);
      return data.user;
    },
    [loginWithToken]
  );

  const register = useCallback(
    async (name, email, password, skills) => {
      const { data } = await api.post("/api/auth/register", { name, email, password, skills });
      loginWithToken(data.token, data.user);
      return data.user;
    },
    [loginWithToken]
  );

  // Saves profile fields and keeps the local user in sync
  const updateProfile = useCallback(async (fields) => {
    const { data } = await api.put("/api/users/me", fields);
    setUser(data);
    return data;
  }, []);

  // Re-fetch the user (e.g. after a credit change)
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    try {
      const { data } = await api.get("/api/users/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
