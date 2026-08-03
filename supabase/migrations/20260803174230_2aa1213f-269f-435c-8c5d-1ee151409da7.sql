-- 1. VEHICLES: consolidate duplicate SELECT policies
DROP POLICY IF EXISTS "Users can only see their company's data" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view their company's vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view vehicles from their company" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles viewable by users in same company" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select_super_admin" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles modifiable by company admin" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_select_scoped" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_admins" ON public.vehicles;

CREATE POLICY "vehicles_select_scoped"
ON public.vehicles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR company_id = public.get_current_company_id()
);

CREATE POLICY "vehicles_delete_admins"
ON public.vehicles FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (company_id = public.get_current_company_id()
      AND public.has_role(auth.uid(), 'company_admin'::app_role))
);

-- 2. DRIVERS: consolidate + explicit super_admin scope
DROP POLICY IF EXISTS "Users can only see their company's data" ON public.drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "drivers_select_scoped" ON public.drivers;
DROP POLICY IF EXISTS "drivers_manage_company_admin" ON public.drivers;
DROP POLICY IF EXISTS "drivers_manage_super_admin" ON public.drivers;

CREATE POLICY "drivers_select_scoped"
ON public.drivers FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR company_id = public.get_current_company_id()
);

CREATE POLICY "drivers_manage_company_admin"
ON public.drivers FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = public.get_current_company_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = public.get_current_company_id()
);

CREATE POLICY "drivers_manage_super_admin"
ON public.drivers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. WORKFLOW_STATES: restrict SELECT to supervisors/admins/assignee
DROP POLICY IF EXISTS "workflow_states_company_access" ON public.workflow_states;
DROP POLICY IF EXISTS "workflow_states_select_privileged" ON public.workflow_states;

CREATE POLICY "workflow_states_select_privileged"
ON public.workflow_states FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    company_id = public.get_current_company_id()
    AND (
      public.has_role(auth.uid(), 'company_admin'::app_role)
      OR public.has_role(auth.uid(), 'supervisor'::app_role)
      OR assigned_to = auth.uid()
    )
  )
);

-- 4. COMPANY LOGOS storage: strict folder-based ownership
DROP POLICY IF EXISTS "Users can upload their company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their company logo" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can manage company logos" ON storage.objects;
DROP POLICY IF EXISTS "company_logos_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "company_logos_update_owner" ON storage.objects;
DROP POLICY IF EXISTS "company_logos_delete_owner" ON storage.objects;

CREATE POLICY "company_logos_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'company_admin'::app_role
        AND ur.company_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "company_logos_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'company_admin'::app_role
        AND ur.company_id::text = (storage.foldername(name))[1]
    )
  )
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'company_admin'::app_role
        AND ur.company_id::text = (storage.foldername(name))[1]
    )
  )
);

CREATE POLICY "company_logos_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'company_admin'::app_role
        AND ur.company_id::text = (storage.foldername(name))[1]
    )
  )
);
