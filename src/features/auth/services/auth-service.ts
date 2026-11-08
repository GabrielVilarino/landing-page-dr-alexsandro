import { apiFetch } from "@/lib/api-client";
import {
  normalizeLogin,
  type ChangePasswordInput,
  type LoginInput,
} from "@/features/auth/schemas/auth-schema";
import type { CurrentUser } from "@/features/auth/types/auth";

function normalizeCurrentUser(value: unknown): CurrentUser {
  const item =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const roles = Array.isArray(item.roles)
    ? item.roles.map((role) => {
        if (typeof role === "string") return role;
        const roleItem =
          typeof role === "object" && role !== null
            ? (role as Record<string, unknown>)
            : {};
        return {
          id: roleItem.id === undefined ? undefined : Number(roleItem.id),
          name: String(roleItem.name ?? ""),
          description:
            roleItem.description === undefined
              ? undefined
              : String(roleItem.description),
        };
      })
    : [];
  const permissions = Array.isArray(item.permissions)
    ? item.permissions
        .map((permission) => {
          if (typeof permission === "string") return permission;
          const permissionItem =
            typeof permission === "object" && permission !== null
              ? (permission as Record<string, unknown>)
              : {};
          return String(permissionItem.code ?? permissionItem.name ?? "");
        })
        .filter(Boolean)
    : [];
  return {
    id: Number(item.id),
    name: String(item.name ?? ""),
    email: String(item.email ?? ""),
    roles,
    permissions,
    must_change_password: Boolean(item.must_change_password),
  };
}

export const authService = {
  async login(values: LoginInput) {
    return normalizeCurrentUser(
      await apiFetch<unknown>("/session/login", {
        method: "POST",
        body: JSON.stringify(normalizeLogin(values)),
      }),
    );
  },
  async me() {
    return normalizeCurrentUser(await apiFetch<unknown>("/session/me"));
  },
  logout() {
    return apiFetch<void>("/session/logout", { method: "POST" });
  },
  changePassword(values: ChangePasswordInput) {
    return apiFetch<void>("/session/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: values.current_password,
        new_password: values.new_password,
      }),
    });
  },
};
