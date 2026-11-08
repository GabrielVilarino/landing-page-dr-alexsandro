export interface RoleSummary {
  id?: number;
  name: string;
  description?: string | null;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  roles: Array<RoleSummary | string>;
  permissions: string[];
  must_change_password: boolean;
}
