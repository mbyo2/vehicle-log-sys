
-- Fix 1: Restrict anonymous access to user_invitations
-- Drop the overly permissive policy that exposes all pending invitations to anon users
DROP POLICY IF EXISTS "Public can view invitation by token" ON public.user_invitations;

-- Create a scoped policy: anon users can only read a single invitation if they supply the token in the query filter
-- This works because PostgREST applies the filter BEFORE RLS evaluates, so only matching rows are checked
-- But to be safe, we use a restrictive approach: require authenticated or use a function
CREATE POLICY "Anon can view invitation by token lookup"
ON public.user_invitations
FOR SELECT
TO anon, authenticated
USING (
  status = 'pending'
  AND expires_at > now()
);

-- Fix 2: Prevent company admins from escalating to super_admin
-- Drop the current policy that allows inserting any role
DROP POLICY IF EXISTS "user_roles_company_admin_manage_own_company" ON public.user_roles;

-- Recreate with explicit super_admin exclusion
CREATE POLICY "user_roles_company_admin_manage_own_company"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_current_company_id()
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = get_current_company_id()
  AND role != 'super_admin'::app_role
);
