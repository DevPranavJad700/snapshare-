import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("snapshare_token") || null);
  const [loading, setLoading] = useState(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem("snapshare_token");
    localStorage.removeItem("snapshare_user");
    setToken(null);
    setUser(null);
  }, []);

  // Fetch current user if token exists on boot
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("snapshare_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("snapshare_user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn("Auth session expired or invalid token:", err?.response?.data || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => logout();
    window.addEventListener("snapshare:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("snapshare:unauthorized", handleUnauthorized);
  }, [logout]);

  // Login action
  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("snapshare_token", newToken);
    localStorage.setItem("snapshare_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  // Register action
  const register = async (username, password) => {
    const res = await authApi.register({ username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("snapshare_token", newToken);
    localStorage.setItem("snapshare_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
