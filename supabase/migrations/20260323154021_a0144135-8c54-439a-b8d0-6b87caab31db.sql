-- 1. Drop overly permissive user_roles read policy
DROP POLICY IF EXISTS "user_roles_authenticated_read" ON public.user_roles;

-- 2. Drop overly permissive vehicle_services SELECT policy
DROP POLICY IF EXISTS "Vehicle services are viewable by authenticated users" ON public.vehicle_services;

-- 3. Drop overly permissive vehicle_logs INSERT policy
DROP POLICY IF EXISTS "Vehicle logs can be inserted by authenticated users" ON public.vehicle_logs;

-- 4. Add company-scoped INSERT policy for vehicle_logs
CREATE POLICY "Vehicle logs insert scoped to user company"
ON public.vehicle_logs
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);