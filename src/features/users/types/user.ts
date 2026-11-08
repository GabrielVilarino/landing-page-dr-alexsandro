import type { RoleSummary } from "@/features/auth/types/auth";

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  must_change_password: boolean;
  roles: RoleSummary[];
}

export interface UserList {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}
