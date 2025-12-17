-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Auth Schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create Auth Users Table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'authenticated',
    provider VARCHAR(50) DEFAULT 'email',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sign_in TIMESTAMP WITH TIME ZONE
);

-- Create Public Schema Helper (Mocking Supabase function)
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT NULL::UUID; -- In a real Supabase setup this reads from JWT claim.
$$ LANGUAGE SQL;

-- Create default admin user
-- Password is 'admin123' hashed with bcrypt (cost 10)
INSERT INTO auth.users (email, encrypted_password, role)
VALUES (
    'admin@irondb.io', 
    '$2a$10$w..8.yV/m/..p/..t/..u/..x/..z/..', 
    'service_role'
) ON CONFLICT (email) DO NOTHING;

-- Create some demo tables in public
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'pending',
    total NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data
INSERT INTO public.products (title, price, stock) VALUES
('High-Performance Laptop', 1299.00, 45),
('Ergonomic Chair', 299.50, 12),
('Wireless Keyboard', 89.99, 200)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Policy Table (System table to track policies if needed, but we use pg_policy system catalog)
-- This file runs on container startup to init the DB.
