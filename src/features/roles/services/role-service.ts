import type { RoleInput } from "@/features/roles/schemas/role-schema";
import type { Permission, Role } from "@/features/roles/types/role";
import { apiFetch } from "@/lib/api-client";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function rawArray(payload: unknown, key: "roles" | "permissions") {
  if (Array.isArray(payload)) return payload;
  const container = record(payload);
  if (Array.isArray(container.items)) return container.items;
  if (Array.isArray(container.data)) return container.data;
  return Array.isArray(container[key]) ? container[key] : [];
}

function normalizePermission(value: unknown): Permission {
  if (typeof value === "string") return { id: 0, code: value };
  const item = record(value);
  return {
    id: Number(item.id),
    code: String(item.code ?? item.name ?? ""),
    name: item.name === undefined ? undefined : String(item.name),
    description:
      item.description === undefined ? undefined : String(item.description),
  };
}

function normalizeRole(value: unknown): Role {
  const item = record(value);
  const rawPermissions = Array.isArray(item.permissions)
    ? item.permissions
    : [];
  return {
    id: Number(item.id),
    name: String(item.name ?? ""),
    description:
      item.description === null || item.description === undefined
        ? null
        : String(item.description),
    permissions: rawPermissions.map(normalizePermission),
  };
}

export const roleService = {
  async list() {
    return rawArray(
      await apiFetch<unknown>("/gateway/admin/roles"),
      "roles",
    ).map(normalizeRole);
  },
  async permissions() {
    return rawArray(
      await apiFetch<unknown>("/gateway/admin/permissions"),
      "permissions",
    ).map(normalizePermission);
  },
  create(values: RoleInput) {
    return apiFetch<Role>("/gateway/admin/roles", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
      }),
    });
  },
  update(id: number, values: RoleInput) {
    return apiFetch<Role>(`/gateway/admin/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
      }),
    });
  },
  setPermissions(id: number, permissionIds: number[]) {
    return apiFetch<Role>(`/gateway/admin/roles/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};
