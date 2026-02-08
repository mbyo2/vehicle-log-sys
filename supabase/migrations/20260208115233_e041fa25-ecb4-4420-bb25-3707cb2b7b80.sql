-- Drop the incorrectly typed index and recreate with proper cast
DROP INDEX IF EXISTS public.user_roles_single_super_admin;

CREATE UNIQUE INDEX user_roles_single_super_admin
ON public.user_roles ((role)) WHERE role = 'super_admin'::public.app_role;