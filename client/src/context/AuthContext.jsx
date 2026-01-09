import { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

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
          const { data } = await axios.get("http://localhost:5000/api/users/me", config);
          setUser(data);
        } catch (error) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkUserLoggedIn();
  }, []);

  // Login Function
  const login = async (email, password) => {
    const { data } = await axios.post("http://localhost:5000/api/users/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data); // This data includes name, email, and timeCredits
  };

  // Register Function
  const register = async (name, email, password, skills) => {
    const { data } = await axios.post("http://localhost:5000/api/users", { name, email, password, skills });
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
        const { data } = await axios.get("http://localhost:5000/api/users/me", config);
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