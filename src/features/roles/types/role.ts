export interface Permission {
  id: number;
  code: string;
  name?: string;
  description?: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}
