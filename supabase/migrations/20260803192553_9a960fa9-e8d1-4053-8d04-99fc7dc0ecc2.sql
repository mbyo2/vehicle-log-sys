-- FUEL LOGS: require driver_id to be the caller's own driver record unless elevated role
DROP POLICY IF EXISTS "Fuel logs insert scoped to user company" ON public.fuel_logs;
CREATE POLICY "Fuel logs insert scoped to user company"
ON public.fuel_logs FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_current_company_id()
  AND (
    public.has_role(auth.uid(), 'company_admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      driver_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.drivers d
        WHERE d.id = fuel_logs.driver_id
          AND d.profile_id = auth.uid()
      )
    )
  )
);

-- VEHICLE LOGS: consolidate to a single INSERT policy with driver ownership check
DROP POLICY IF EXISTS "Users can insert vehicle logs for their company vehicles" ON public.vehicle_logs;
DROP POLICY IF EXISTS "Vehicle logs insert scoped to user company" ON public.vehicle_logs;
CREATE POLICY "Vehicle logs insert scoped to user company"
ON public.vehicle_logs FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_current_company_id()
  AND vehicle_id IN (
    SELECT v.id FROM public.vehicles v WHERE v.company_id = public.get_current_company_id()
  )
  AND (
    public.has_role(auth.uid(), 'company_admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = vehicle_logs.driver_id
        AND d.profile_id = auth.uid()
    )
  )
);

-- SECURITY EVENTS: require attributable user for client inserts
DROP POLICY IF EXISTS "security_events_insert_self" ON public.security_events;
CREATE POLICY "security_events_insert_self"
ON public.security_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
