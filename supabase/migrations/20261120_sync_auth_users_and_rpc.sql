-- ==============================================================================
-- CSCCopy: Sync auth.users to public.users & Create get_admin_users() RPC
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

-- Create index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 2. Populate / Synchronize all existing users from auth.users into public.users
INSERT INTO public.users (id, phone, full_name, business_name, email, created_at, updated_at)
SELECT 
  au.id,
  au.phone,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'CSC Operator'),
  coalesce(au.raw_user_meta_data->>'business_name', 'CSC Center'),
  au.email,
  au.created_at,
  now()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  phone = coalesce(EXCLUDED.phone, public.users.phone),
  full_name = coalesce(EXCLUDED.full_name, public.users.full_name),
  business_name = coalesce(EXCLUDED.business_name, public.users.business_name),
  email = coalesce(EXCLUDED.email, public.users.email),
  updated_at = now();

-- 3. Create high-performance SECURITY DEFINER RPC function to fetch all users with live balances
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  result json;
begin
  select coalesce(json_agg(u), '[]'::json) into result
  from (
    select 
      au.id,
      coalesce(pu.phone, au.phone, '') as phone,
      coalesce(
        pu.full_name,
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        'CSC Operator'
      ) as full_name,
      coalesce(
        pu.business_name,
        au.raw_user_meta_data->>'business_name',
        'CSC Center'
      ) as business_name,
      coalesce(pu.email, au.email, '') as email,
      coalesce(w.balance, 0)::numeric as balance,
      au.created_at,
      coalesce(pu.updated_at, au.updated_at, au.created_at) as updated_at
    from auth.users au
    left join public.users pu on pu.id = au.id
    left join public.wallet w on w.user_id = au.id
    order by au.created_at desc
  ) u;

  return result;
end;
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated, anon, service_role;

-- 4. Automatic Trigger: Whenever a new user signs up in auth.users, sync to public.users & wallet
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, phone, full_name, business_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.phone,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'CSC Operator'),
    coalesce(NEW.raw_user_meta_data->>'business_name', 'CSC Center'),
    NEW.email,
    NEW.created_at,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = coalesce(EXCLUDED.phone, public.users.phone),
    full_name = coalesce(EXCLUDED.full_name, public.users.full_name),
    business_name = coalesce(EXCLUDED.business_name, public.users.business_name),
    email = coalesce(EXCLUDED.email, public.users.email),
    updated_at = now();

  INSERT INTO public.wallet (user_id, balance, currency, created_at, updated_at)
  VALUES (NEW.id, 0, 'INR', now(), now())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
