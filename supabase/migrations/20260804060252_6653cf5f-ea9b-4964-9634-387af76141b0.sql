-- 1. Consolidate SELECT policies on vehicle_logs / vehicle_services / fuel_prices
DROP POLICY IF EXISTS "Users can only see their company's data" ON public.vehicle_logs;
DROP POLICY IF EXISTS "Users can view vehicle logs from their company" ON public.vehicle_logs;
CREATE POLICY "vehicle_logs_select_company" ON public.vehicle_logs
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR company_id = get_current_company_id()
);

DROP POLICY IF EXISTS "Users can only see their company's data" ON public.vehicle_services;
DROP POLICY IF EXISTS "Users can view vehicle services from their company" ON public.vehicle_services;
CREATE POLICY "vehicle_services_select_company" ON public.vehicle_services
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR company_id = get_current_company_id()
);

DROP POLICY IF EXISTS "Users can only see their company's data" ON public.fuel_prices;
CREATE POLICY "fuel_prices_select_company" ON public.fuel_prices
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR company_id = get_current_company_id()
);

DROP POLICY IF EXISTS "Admins can manage fuel prices" ON public.fuel_prices;
CREATE POLICY "fuel_prices_admin_manage" ON public.fuel_prices
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- 2. Restrict company_admin writes on role_permissions to a vetted resource/action set
DROP POLICY IF EXISTS "role_permissions_company_admin_access" ON public.role_permissions;

CREATE POLICY "role_permissions_company_admin_read" ON public.role_permissions
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
);

CREATE POLICY "role_permissions_company_admin_write" ON public.role_permissions
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
  AND role = ANY (ARRAY['supervisor'::user_role, 'driver'::user_role])
  AND resource = ANY (ARRAY['dashboard','vehicles','drivers','trips','maintenance','documents','reports','analytics','notifications'])
  AND action = ANY (ARRAY['view','create','update','delete','approve','export'])
);

CREATE POLICY "role_permissions_company_admin_update" ON public.role_permissions
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
  AND role = ANY (ARRAY['supervisor'::user_role, 'driver'::user_role])
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
  AND role = ANY (ARRAY['supervisor'::user_role, 'driver'::user_role])
  AND resource = ANY (ARRAY['dashboard','vehicles','drivers','trips','maintenance','documents','reports','analytics','notifications'])
  AND action = ANY (ARRAY['view','create','update','delete','approve','export'])
);

CREATE POLICY "role_permissions_company_admin_delete" ON public.role_permissions
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = get_current_company_id()
  AND role = ANY (ARRAY['supervisor'::user_role, 'driver'::user_role])
);