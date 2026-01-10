/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on page refresh)
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const config = {
            headers: { Authorization: `Bearer ${token}` },
          };
          // FIX 1: Removed http://localhost:5000 (handled by App.jsx)
          const { data } = await axios.get("/api/users/me", config);
          setUser(data);
        } catch (error) {
          console.error(error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  // Login Function
  const login = async (email, password) => {
    // FIX 2: Removed http://localhost:5000
    const { data } = await axios.post("/api/users/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data); 
  };

  // Register Function
  const register = async (name, email, password, skills) => {
    // FIX 3: Removed http://localhost:5000
    const { data } = await axios.post("/api/users", { name, email, password, skills });
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Refresh User Data (To update Wallet Balance after a transaction)
  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // FIX 4: Removed http://localhost:5000
      const { data } = await axios.get("/api/users/me", config);
      setUser(data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;