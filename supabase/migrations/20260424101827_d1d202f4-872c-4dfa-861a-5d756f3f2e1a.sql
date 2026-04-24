-- ============================================================
-- P0 SECURITY MIGRATION (corrected: user_invitations.role is user_role)
-- ============================================================

-- 1) USER_INVITATIONS
DROP POLICY IF EXISTS "Anon can view invitation by token lookup" ON public.user_invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role public.user_role,
  company_id uuid,
  status text,
  expires_at timestamptz,
  company_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.role, i.company_id, i.status, i.expires_at, c.name
  FROM public.user_invitations i
  LEFT JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = _token
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

-- 2) FUEL_LOGS
DROP POLICY IF EXISTS "Fuel logs can be inserted by authenticated users" ON public.fuel_logs;
DROP POLICY IF EXISTS "Fuel logs can be updated by admin and supervisor" ON public.fuel_logs;

CREATE POLICY "Fuel logs insert scoped to user company"
  ON public.fuel_logs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_current_company_id());

CREATE POLICY "Fuel logs update by admin or supervisor in company"
  ON public.fuel_logs FOR UPDATE TO authenticated
  USING (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  )
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

-- 3) MAINTENANCE_PARTS
DROP POLICY IF EXISTS "Maintenance parts viewable by authenticated users" ON public.maintenance_parts;
DROP POLICY IF EXISTS "Maintenance parts manageable by admin and supervisor" ON public.maintenance_parts;
DROP POLICY IF EXISTS "Maintenance parts updatable by admin and supervisor" ON public.maintenance_parts;

CREATE POLICY "maintenance_parts_select_company"
  ON public.maintenance_parts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vehicle_services vs WHERE vs.id = maintenance_parts.maintenance_id AND vs.company_id = public.get_current_company_id())
    OR public.has_role(auth.uid(),'super_admin')
  );

CREATE POLICY "maintenance_parts_insert_company"
  ON public.maintenance_parts FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
    AND EXISTS (SELECT 1 FROM public.vehicle_services vs WHERE vs.id = maintenance_parts.maintenance_id AND (vs.company_id = public.get_current_company_id() OR public.has_role(auth.uid(),'super_admin')))
  );

CREATE POLICY "maintenance_parts_update_company"
  ON public.maintenance_parts FOR UPDATE TO authenticated
  USING (
    (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
    AND EXISTS (SELECT 1 FROM public.vehicle_services vs WHERE vs.id = maintenance_parts.maintenance_id AND (vs.company_id = public.get_current_company_id() OR public.has_role(auth.uid(),'super_admin')))
  );

CREATE POLICY "maintenance_parts_delete_company"
  ON public.maintenance_parts FOR DELETE TO authenticated
  USING (
    (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
    AND EXISTS (SELECT 1 FROM public.vehicle_services vs WHERE vs.id = maintenance_parts.maintenance_id AND (vs.company_id = public.get_current_company_id() OR public.has_role(auth.uid(),'super_admin')))
  );

-- 4) TRIP_APPROVALS
DROP POLICY IF EXISTS "Supervisors and admins can view approvals" ON public.trip_approvals;
DROP POLICY IF EXISTS "Supervisors and admins can insert approvals" ON public.trip_approvals;

CREATE POLICY "trip_approvals_select_company"
  ON public.trip_approvals FOR SELECT TO authenticated
  USING (
    (public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
    AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_approvals.trip_id AND (t.company_id = public.get_current_company_id() OR public.has_role(auth.uid(),'super_admin')))
  );

CREATE POLICY "trip_approvals_insert_company"
  ON public.trip_approvals FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
    AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_approvals.trip_id AND (t.company_id = public.get_current_company_id() OR public.has_role(auth.uid(),'super_admin')))
  );

-- 5) VEHICLES / VEHICLE_SERVICES / VEHICLE_LOGS / CURRENCY_SETTINGS
DROP POLICY IF EXISTS "Vehicles can be inserted by admin and supervisor" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles can be updated by admin and supervisor" ON public.vehicles;

CREATE POLICY "vehicles_insert_company_admin_or_supervisor"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "vehicles_update_company_admin_or_supervisor"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  )
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

DROP POLICY IF EXISTS "Vehicle services can be inserted by admin and supervisor" ON public.vehicle_services;
DROP POLICY IF EXISTS "Vehicle services can be updated by admin and supervisor" ON public.vehicle_services;

CREATE POLICY "vehicle_services_insert_company"
  ON public.vehicle_services FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "vehicle_services_update_company"
  ON public.vehicle_services FOR UPDATE TO authenticated
  USING (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  )
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

DROP POLICY IF EXISTS "Vehicle logs can be updated by admin and supervisor" ON public.vehicle_logs;

CREATE POLICY "vehicle_logs_update_company"
  ON public.vehicle_logs FOR UPDATE TO authenticated
  USING (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  )
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'supervisor') OR public.has_role(auth.uid(),'super_admin'))
  );

DROP POLICY IF EXISTS "Currency settings can be managed by admin" ON public.currency_settings;
DROP POLICY IF EXISTS "Currency settings can be updated by admin" ON public.currency_settings;

CREATE POLICY "currency_settings_insert_company_admin"
  ON public.currency_settings FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
  );

CREATE POLICY "currency_settings_update_company_admin"
  ON public.currency_settings FOR UPDATE TO authenticated
  USING (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
  )
  WITH CHECK (
    company_id = public.get_current_company_id()
    AND (public.has_role(auth.uid(),'company_admin') OR public.has_role(auth.uid(),'super_admin'))
  );

-- 6) Function search_path
ALTER FUNCTION public.should_send_notification(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.get_notification_preferences(uuid, uuid) SET search_path = public;

-- 7) STORAGE: drop redundant broad SELECT policies (buckets remain public via public URLs)
DROP POLICY IF EXISTS "Allow public access to company logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;