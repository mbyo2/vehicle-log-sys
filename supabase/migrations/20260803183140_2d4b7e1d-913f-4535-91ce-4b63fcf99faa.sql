-- 1. Restrict get_notification_preferences to self or company admins
CREATE OR REPLACE FUNCTION public.get_notification_preferences(p_user_id uuid, p_company_id uuid)
 RETURNS notification_preferences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefs notification_preferences%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id <> auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role = 'company_admin'::app_role
         AND company_id = p_company_id
     )
  THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO prefs
  FROM notification_preferences
  WHERE user_id = p_user_id
  AND (company_id = p_company_id OR company_id IS NULL)
  LIMIT 1;

  IF prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id, company_id)
    VALUES (p_user_id, p_company_id)
    RETURNING * INTO prefs;
  END IF;

  RETURN prefs;
END;
$function$;

-- 2. Prevent company_admin from granting elevated role permissions
DROP POLICY IF EXISTS role_permissions_company_admin_access ON public.role_permissions;

CREATE POLICY role_permissions_company_admin_access
ON public.role_permissions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
  AND role NOT IN ('super_admin'::user_role, 'company_admin'::user_role)
);

-- 3. Fix trip_approvals policies to reference vehicle_logs
DROP POLICY IF EXISTS trip_approvals_select_company ON public.trip_approvals;
DROP POLICY IF EXISTS trip_approvals_insert_company ON public.trip_approvals;

CREATE POLICY trip_approvals_select_company
ON public.trip_approvals
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'supervisor'::app_role)
   OR has_role(auth.uid(), 'company_admin'::app_role)
   OR has_role(auth.uid(), 'super_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.vehicle_logs vl
    WHERE vl.id = trip_approvals.trip_id
      AND (vl.company_id = get_current_company_id()
           OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

CREATE POLICY trip_approvals_insert_company
ON public.trip_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'supervisor'::app_role)
   OR has_role(auth.uid(), 'company_admin'::app_role)
   OR has_role(auth.uid(), 'super_admin'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.vehicle_logs vl
    WHERE vl.id = trip_approvals.trip_id
      AND (vl.company_id = get_current_company_id()
           OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);