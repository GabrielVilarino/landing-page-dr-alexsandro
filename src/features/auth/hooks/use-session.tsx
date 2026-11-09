"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { authService } from "@/features/auth/services/auth-service";
import type { CurrentUser } from "@/features/auth/types/auth";
import { ApiError } from "@/lib/api-error";

interface SessionContextValue {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  can: (permission: string) => boolean;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
      setError(null);
    } catch (caught) {
      setUser(null);
      if (caught instanceof ApiError && caught.status === 401) {
        setError(null);
        router.replace("/admin/login");
        router.refresh();
      } else {
        setError("Não foi possível carregar sua conta.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timeout);
  }, [reload]);

  useEffect(() => {
    if (user?.must_change_password && pathname !== "/admin/trocar-senha") {
      router.replace("/admin/trocar-senha");
    }
  }, [pathname, router, user]);

  useEffect(() => {
    const expired = () => {
      setUser(null);
      router.replace("/admin/login");
      router.refresh();
    };
    const forbidden = () => void reload();
    window.addEventListener("session:expired", expired);
    window.addEventListener("session:forbidden", forbidden);
    return () => {
      window.removeEventListener("session:expired", expired);
      window.removeEventListener("session:forbidden", forbidden);
    };
  }, [reload, router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      router.replace("/admin/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      error,
      can: (permission) => Boolean(user?.permissions.includes(permission)),
      reload,
      logout,
    }),
    [error, loading, logout, reload, user],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useSession deve ser usado dentro de SessionProvider.");
  return context;
}
