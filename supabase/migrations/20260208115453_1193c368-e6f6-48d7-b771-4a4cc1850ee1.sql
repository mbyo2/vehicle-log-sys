-- Drop and recreate the function with explicit text comparison
DROP FUNCTION IF EXISTS public.check_if_first_user();

CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role::text = 'super_admin'
  )
$$;