-- Fix 1: Ensure user_roles table has proper RLS policies for user creation
-- This allows the trigger to insert roles for new users

-- Drop existing restrictive policies that might block user creation
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_access" ON public.user_roles;

-- Create policies that allow user creation to work properly
CREATE POLICY "user_roles_service_role_manage"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "user_roles_authenticated_read"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_roles_super_admin_manage"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "user_roles_company_admin_manage_own_company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin') 
  AND company_id = public.get_current_company_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin') 
  AND company_id = public.get_current_company_id()
);

-- Fix 2: Ensure profiles table can be created by the trigger
-- Drop and recreate profiles policies to allow trigger insertion

DROP POLICY IF EXISTS "profile_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_manage" ON public.profiles;

-- Service role can do everything (for triggers)
CREATE POLICY "profiles_service_role_manage"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can read their own profile
CREATE POLICY "profiles_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "profiles_super_admin_read"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Company admins can read profiles in their company
CREATE POLICY "profiles_company_admin_read"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin')
  AND company_id = public.get_current_company_id()
);

-- Users can update their own profile (but not role or company)
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Super admins can manage all profiles
CREATE POLICY "profiles_super_admin_manage"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Fix 3: Ensure companies table allows creation for new company admins
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "companies_service_role_manage"
ON public.companies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "companies_users_view_own"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "companies_super_admin_manage"
ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "companies_company_admin_update_own"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin')
  AND id = public.get_current_company_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin')
  AND id = public.get_current_company_id()
);

-- Fix 4: Add check_if_first_user function to work with user_roles
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE role = 'super_admin'
    LIMIT 1
  );
END;
$$;