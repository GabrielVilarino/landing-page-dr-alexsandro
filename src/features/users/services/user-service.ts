import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserRolesInput,
} from "@/features/users/schemas/user-schema";
import type { User, UserList } from "@/features/users/types/user";
import { apiFetch } from "@/lib/api-client";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeUser(value: unknown): User {
  const item = record(value);
  const rawRoles = Array.isArray(item.roles) ? item.roles : [];
  return {
    id: Number(item.id),
    name: String(item.name ?? ""),
    email: String(item.email ?? ""),
    active: Boolean(item.active ?? item.is_active),
    must_change_password: Boolean(item.must_change_password),
    roles: rawRoles.map((role) => {
      if (typeof role === "string") return { name: role };
      const roleItem = record(role);
      return {
        id: roleItem.id === undefined ? undefined : Number(roleItem.id),
        name: String(roleItem.name ?? ""),
        description:
          roleItem.description === undefined
            ? undefined
            : String(roleItem.description),
      };
    }),
  };
}

function normalizeList(
  payload: unknown,
  limit: number,
  offset: number,
): UserList {
  const container = record(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(container.items)
      ? container.items
      : Array.isArray(container.users)
        ? container.users
        : Array.isArray(container.data)
          ? container.data
          : [];
  const items = rawItems.map(normalizeUser);
  return {
    items,
    total: Number(container.total ?? container.count ?? items.length),
    limit: Number(container.limit ?? limit),
    offset: Number(container.offset ?? offset),
  };
}

export const userService = {
  async list(limit = 20, offset = 0) {
    const payload = await apiFetch<unknown>(
      `/gateway/admin/users?limit=${limit}&offset=${offset}`,
    );
    return normalizeList(payload, limit, offset);
  },
  async get(id: number) {
    return normalizeUser(await apiFetch<unknown>(`/gateway/admin/users/${id}`));
  },
  create(values: CreateUserInput) {
    return apiFetch<User>("/gateway/admin/users", {
      method: "POST",
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role_ids: values.role_ids,
      }),
    });
  },
  update(id: number, values: UpdateUserInput) {
    return apiFetch<User>(`/gateway/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
      }),
    });
  },
  setActive(id: number, active: boolean) {
    return apiFetch<User>(`/gateway/admin/users/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },
  setRoles(id: number, values: UserRolesInput) {
    return apiFetch<User>(`/gateway/admin/users/${id}/roles`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
  },
  resetPassword(id: number, values: ResetPasswordInput) {
    return apiFetch<void>(`/gateway/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ temporary_password: values.temporary_password }),
    });
  },
};
