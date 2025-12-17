import { Table, DatabaseUser, RlsPolicy, DatabaseFunction } from '../types';

export const MOCK_TABLES: Table[] = [
  {
    id: 't1',
    name: 'users',
    schema: 'auth',
    rowCount: 12450,
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isNullable: false, defaultValue: 'gen_random_uuid()' },
      { name: 'email', type: 'varchar', isPrimary: false, isNullable: false },
      { name: 'encrypted_password', type: 'varchar', isPrimary: false, isNullable: true },
      { name: 'created_at', type: 'timestamptz', isPrimary: false, isNullable: false, defaultValue: 'now()' },
    ]
  },
  {
    id: 't2',
    name: 'products',
    schema: 'public',
    rowCount: 85,
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'bigint', isPrimary: true, isNullable: false, defaultValue: 'nextval()' },
      { name: 'title', type: 'text', isPrimary: false, isNullable: false },
      { name: 'price', type: 'numeric', isPrimary: false, isNullable: false },
      { name: 'stock', type: 'integer', isPrimary: false, isNullable: false, defaultValue: '0' },
    ]
  },
  {
    id: 't3',
    name: 'orders',
    schema: 'public',
    rowCount: 1205,
    rlsEnabled: false,
    columns: [
      { name: 'id', type: 'bigint', isPrimary: true, isNullable: false },
      { name: 'user_id', type: 'uuid', isPrimary: false, isNullable: false },
      { name: 'status', type: 'varchar', isPrimary: false, isNullable: false, defaultValue: "'pending'" },
    ]
  }
];

export const MOCK_USERS: DatabaseUser[] = [
  { id: 'u1', email: 'alice@example.com', provider: 'email', created_at: '2023-10-01 10:00:00', last_sign_in: '2023-10-25 14:20:00', role: 'authenticated' },
  { id: 'u2', email: 'bob@example.com', provider: 'google', created_at: '2023-10-02 11:30:00', last_sign_in: '2023-10-24 09:15:00', role: 'authenticated' },
  { id: 'u3', email: 'admin@irondb.io', provider: 'email', created_at: '2023-09-15 08:00:00', last_sign_in: '2023-10-26 16:45:00', role: 'service_role' },
  { id: 'u4', email: 'charlie@test.com', provider: 'email', created_at: '2023-10-05 14:20:00', last_sign_in: '2023-10-05 14:20:00', role: 'authenticated' },
];

export const MOCK_POLICIES: RlsPolicy[] = [
  { id: 'p1', tableId: 't2', name: 'Public read access', command: 'SELECT', roles: ['anon', 'authenticated'], using: 'true' },
  { id: 'p2', tableId: 't2', name: 'Admin update access', command: 'UPDATE', roles: ['service_role'], using: 'true', check: 'true' },
  { id: 'p3', tableId: 't1', name: 'Users can see own data', command: 'SELECT', roles: ['authenticated'], using: 'auth.uid() = id' },
];

export const MOCK_FUNCTIONS: DatabaseFunction[] = [
  { id: 'f1', name: 'handle_new_user', args: '', returnType: 'trigger', language: 'plpgsql', definition: 'BEGIN\n  INSERT INTO public.profiles (id) VALUES (new.id);\n  RETURN new;\nEND;' },
  { id: 'f2', name: 'get_monthly_revenue', args: 'month int, year int', returnType: 'numeric', language: 'sql', definition: 'SELECT sum(price) FROM orders WHERE ...' },
];
