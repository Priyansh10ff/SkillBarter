/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback } from "react";
import api, { TOKEN_KEY } from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      if (localStorage.getItem(TOKEN_KEY)) {
        try {
          const { data } = await api.get("/api/users/me");
          setUser(data);
        } catch (error) {
          console.error(error);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/users/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return { success: true, data };
  }, []);

  const register = useCallback(async (name, email, password, skills) => {
    const { data } = await api.post("/api/users", { name, email, password, skills });
    return { success: true, data };
  }, []);

  // Used after email verification, which returns a session directly
  const loginWithToken = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
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
    <AuthContext.Provider value={{ user, login, loginWithToken, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
