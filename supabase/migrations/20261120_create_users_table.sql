-- Migration: Create public.users table supporting password_hash and legacy user migration
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  full_name text,
  email text,
  business_name text,
  password_hash text, -- bcrypt hash, nullable for legacy OTP-only users
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read and write policies for user authentication & registration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public select on users') THEN
    CREATE POLICY "Allow public select on users" ON public.users FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert on users') THEN
    CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public update on users') THEN
    CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Index for instant phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
