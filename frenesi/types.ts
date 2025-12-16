export interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  defaultValue?: string;
}

export interface Table {
  id: string;
  name: string;
  schema: string;
  columns: Column[];
  rowCount: number;
  rlsEnabled: boolean;
}

export interface RlsPolicy {
  id: string;
  tableId: string;
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  using: string;
  check?: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  provider: string;
  created_at: string;
  last_sign_in: string;
  role: string;
}

export interface DatabaseFunction {
  id: string;
  name: string;
  args: string;
  returnType: string;
  language: string;
  definition: string;
}

export type ViewState = 'dashboard' | 'editor' | 'logic' | 'security' | 'users';
