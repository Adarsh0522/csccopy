-- Migration: Ensure public.users has phone, business_name, password_hash, and updated_at columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Ensure public can read and update profile
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
