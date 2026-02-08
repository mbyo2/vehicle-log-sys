-- Create helper functions to avoid enum comparison issues in the edge function

-- Check if a user has super_admin role
CREATE OR REPLACE FUNCTION public.user_has_super_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role = 'super_admin'::app_role
  )
$$;

-- Check if a user has admin-level role (super_admin or company_admin)
CREATE OR REPLACE FUNCTION public.user_has_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles 
  WHERE user_id = _user_id 
  AND role IN ('super_admin'::app_role, 'company_admin'::app_role)
  LIMIT 1
$$;

-- Insert super admin role for user
CREATE OR REPLACE FUNCTION public.insert_super_admin_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (_user_id, 'super_admin'::app_role, NULL)
  ON CONFLICT DO NOTHING;
END;
$$;