
DROP POLICY IF EXISTS "vehicles_insert_company_admin_or_supervisor" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_company_admin_or_supervisor" ON public.vehicles;

CREATE POLICY "vehicles_insert_admins_supervisors" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      company_id = get_current_company_id()
      AND (
        has_role(auth.uid(), 'company_admin'::app_role)
        OR has_role(auth.uid(), 'supervisor'::app_role)
      )
    )
  );

CREATE POLICY "vehicles_update_admins_supervisors" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      company_id = get_current_company_id()
      AND (
        has_role(auth.uid(), 'company_admin'::app_role)
        OR has_role(auth.uid(), 'supervisor'::app_role)
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      company_id = get_current_company_id()
      AND (
        has_role(auth.uid(), 'company_admin'::app_role)
        OR has_role(auth.uid(), 'supervisor'::app_role)
      )
    )
  );
