import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("conjure_token"));
  const [isLoading, setIsLoading] = useState(true);

  // On mount, validate stored token
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("conjure_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function saveToken(t) {
    localStorage.setItem("conjure_token", t);
    setToken(t);
  }

  async function login(email, password) {
    const res = await client.post("/auth/login", { email, password });
    saveToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function signup(name, email, password) {
    const res = await client.post("/auth/signup", { name, email, password });
    saveToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("conjure_token");
    setToken(null);
    setUser(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated: !!user, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
