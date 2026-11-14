import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("dm_token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dm_user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/auth/me", { token })
      .then((u) => {
        setUser(u);
        localStorage.setItem("dm_user", JSON.stringify(u));
      })
      .catch(() => {
        setToken("");
        setUser(null);
        localStorage.removeItem("dm_token");
        localStorage.removeItem("dm_user");
      });
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      async signup(body, { activate = true } = {}) {
        const data = await apiFetch("/api/auth/signup", { method: "POST", body });
        if (activate) {
          localStorage.setItem("dm_token", data.access_token);
          localStorage.setItem("dm_user", JSON.stringify(data.user));
          setToken(data.access_token);
          setUser(data.user);
        }
        return data;
      },
      async login(body) {
        const data = await apiFetch("/api/auth/login", { method: "POST", body });
        localStorage.setItem("dm_token", data.access_token);
        localStorage.setItem("dm_user", JSON.stringify(data.user));
        setToken(data.access_token);
        setUser(data.user);
        return data;
      },
      activateSession(accessToken, nextUser) {
        localStorage.setItem("dm_token", accessToken);
        localStorage.setItem("dm_user", JSON.stringify(nextUser));
        setToken(accessToken);
        setUser(nextUser);
      },
      async updateProfile(body) {
        const u = await apiFetch("/api/auth/me", { method: "PATCH", token, body });
        localStorage.setItem("dm_user", JSON.stringify(u));
        setUser(u);
        return u;
      },
      logout() {
        localStorage.removeItem("dm_token");
        localStorage.removeItem("dm_user");
        setToken("");
        setUser(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
