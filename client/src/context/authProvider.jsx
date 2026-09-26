import { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import { authService } from "@/services/api";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const res = await authService.login(credentials);
      const { token: authToken, user: authUser } = res.data;

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const res = await authService.register(userData);

      const authToken = res.data.token;
      const authUser = res.data.user || res.data.newUser;

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}