/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { loginUser, registerUser } from "../services/auth";
import type {
  UserLoginPayload,
  UserRegisterPayload,
  UsuarioResponse,
} from "../types/api";
import { setAccessToken, setUnauthorizedHandler } from "../services/api";

interface AuthContextValue {
  user: UsuarioResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: UserLoginPayload) => Promise<void>;
  register: (payload: UserRegisterPayload) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "ehealth.token";
const USER_KEY = "ehealth.user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken) {
      setAccessToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as UsuarioResponse);
        } catch {
          localStorage.removeItem(USER_KEY);
        }
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  async function login(payload: UserLoginPayload) {
    const authData = await loginUser(payload);
    setAccessToken(authData.access_token);
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    setUser(authData.user);
  }

  async function register(payload: UserRegisterPayload) {
    const authData = await registerUser(payload);
    setAccessToken(authData.access_token);
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    setUser(authData.user);
  }

  function logout() {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
