-- ============================================
-- Multi-Company Support with Role Preservation
-- ============================================

-- 1. Drop the old unique constraint if it exists (single user_id constraint)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2. Add a new unique constraint: one role per user per company
-- This allows a user to have different roles in different companies
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_company_unique 
UNIQUE (user_id, company_id);

-- 3. Create company_memberships view for easy querying
CREATE OR REPLACE VIEW public.user_company_memberships AS
SELECT 
  ur.user_id,
  ur.company_id,
  ur.role,
  c.name as company_name,
  c.logo_url as company_logo,
  c.is_active as company_is_active,
  c.subscription_type,
  ur.created_at as joined_at
FROM public.user_roles ur
JOIN public.companies c ON c.id = ur.company_id
WHERE c.is_active = true;

-- 4. Create function to get user's companies
CREATE OR REPLACE FUNCTION public.get_user_companies(p_user_id uuid)
RETURNS TABLE(
  company_id uuid,
  company_name text,
  company_logo text,
  role app_role,
  is_active boolean,
  subscription_type subscription_type
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as company_id,
    c.name as company_name,
    c.logo_url as company_logo,
    ur.role,
    c.is_active,
    c.subscription_type
  FROM user_roles ur
  JOIN companies c ON c.id = ur.company_id
  WHERE ur.user_id = p_user_id
  AND c.is_active = true
  ORDER BY ur.created_at ASC;
$$;

-- 5. Create function to switch user's active company
CREATE OR REPLACE FUNCTION public.get_user_role_for_company(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = p_user_id
  AND company_id = p_company_id
  LIMIT 1;
$$;

-- 6. Grant permissions
GRANT SELECT ON public.user_company_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_companies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_for_company(uuid, uuid) TO authenticated;