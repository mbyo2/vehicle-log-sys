-- Drop broken triggers and functions that reference non-existent 'role' column on profiles
DROP TRIGGER IF EXISTS enforce_single_super_admin ON public.profiles;
DROP TRIGGER IF EXISTS trg_check_super_admin_count ON public.profiles;
DROP FUNCTION IF EXISTS public.check_super_admin_count();
DROP FUNCTION IF EXISTS public.check_single_super_admin();

-- Enforce single super_admin via a unique partial index on user_roles
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_super_admin
ON public.user_roles ((role)) WHERE role = 'super_admin'::public.app_role;

-- Create a helper function to check if this is the first user (no super_admin exists)
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'
  )
$$;