
-- Fix missing RLS policies for drivers table (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage drivers"
ON public.drivers
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

CREATE POLICY "Supervisors can view and update drivers"
ON public.drivers
FOR UPDATE
USING (
  has_role(auth.uid(), 'supervisor'::app_role) AND company_id = get_current_company_id()
)
WITH CHECK (
  has_role(auth.uid(), 'supervisor'::app_role) AND company_id = get_current_company_id()
);

-- Fix missing RLS policies for maintenance_schedules (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage maintenance schedules"
ON public.maintenance_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

CREATE POLICY "Supervisors can manage maintenance schedules"
ON public.maintenance_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'supervisor'::app_role) AND company_id = get_current_company_id()
)
WITH CHECK (
  has_role(auth.uid(), 'supervisor'::app_role) AND company_id = get_current_company_id()
);

-- Fix missing RLS policies for parts_inventory (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage parts inventory"
ON public.parts_inventory
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- Fix missing RLS policies for fuel_prices (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage fuel prices"
ON public.fuel_prices
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- Fix security_audit_logs missing INSERT policy
CREATE POLICY "Authenticated users can insert security audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
