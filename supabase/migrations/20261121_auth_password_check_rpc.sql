-- ==============================================================================
-- CSCCopy: Auth Password Verification & Profile Sync RPCs
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Ensure required columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 2. SECURITY DEFINER RPC: Check if user exists & has password in auth.users or public.users
CREATE OR REPLACE FUNCTION public.check_user_auth(p_phone text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean text;
  v_ten text;
  v_user record;
BEGIN
  v_clean := regexp_replace(p_phone, '\D', '', 'g');
  v_ten := right(v_clean, 10);

  -- Check in auth.users first
  SELECT 
    id,
    phone,
    coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'CSC Operator') as full_name,
    (encrypted_password IS NOT NULL AND length(encrypted_password) > 0) as has_password
  INTO v_user
  FROM auth.users
  WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') LIKE '%' || v_ten
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'exists', true,
      'has_password', v_user.has_password,
      'user_id', v_user.id,
      'full_name', v_user.full_name
    );
  END IF;

  -- Fallback check in public.users
  SELECT 
    id,
    phone,
    coalesce(full_name, 'CSC Operator') as full_name,
    (password_hash IS NOT NULL AND length(password_hash) > 0) as has_password
  INTO v_user
  FROM public.users
  WHERE regexp_replace(coalesce(phone, ''), '\D', '', 'g') LIKE '%' || v_ten
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'exists', true,
      'has_password', v_user.has_password,
      'user_id', v_user.id,
      'full_name', v_user.full_name
    );
  END IF;

  RETURN json_build_object(
    'exists', false,
    'has_password', false,
    'user_id', null,
    'full_name', null
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_auth(text) TO authenticated, anon, service_role;

-- 3. SECURITY DEFINER RPC: Save or update password hash into public.users
CREATE OR REPLACE FUNCTION public.save_user_password(
  p_user_id uuid,
  p_phone text,
  p_full_name text,
  p_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name, password_hash, updated_at)
  VALUES (p_user_id, p_phone, p_full_name, p_password_hash, now())
  ON CONFLICT (id) DO UPDATE SET
    phone = coalesce(EXCLUDED.phone, public.users.phone),
    full_name = coalesce(EXCLUDED.full_name, public.users.full_name),
    password_hash = EXCLUDED.password_hash,
    updated_at = now();
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_user_password(uuid, text, text, text) TO authenticated, anon, service_role;
