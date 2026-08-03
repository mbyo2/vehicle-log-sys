-- 1. role_permissions: scope company_admin to own company
DROP POLICY IF EXISTS role_permissions_admin_access ON public.role_permissions;

CREATE POLICY role_permissions_super_admin_access
ON public.role_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY role_permissions_company_admin_access
ON public.role_permissions FOR ALL TO authenticated
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

CREATE POLICY role_permissions_read_global
ON public.role_permissions FOR SELECT TO authenticated
USING (company_id IS NULL);

-- 2. workflow_states: scope company_admin to own company
DROP POLICY IF EXISTS workflow_states_admin_manage ON public.workflow_states;

CREATE POLICY workflow_states_super_admin_manage
ON public.workflow_states FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY workflow_states_company_admin_manage
ON public.workflow_states FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_current_company_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id = public.get_current_company_id()
);

-- 3. trip_logs: explicit company-scoped oversight policies
CREATE POLICY trip_logs_super_admin_manage
ON public.trip_logs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY trip_logs_company_staff_select
ON public.trip_logs FOR SELECT TO authenticated
USING (
  (public.has_role(auth.uid(), 'company_admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = trip_logs.driver_id
      AND d.company_id = public.get_current_company_id()
  )
);

CREATE POLICY trip_logs_company_staff_update
ON public.trip_logs FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(), 'company_admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = trip_logs.driver_id
      AND d.company_id = public.get_current_company_id()
  )
)
WITH CHECK (
  (public.has_role(auth.uid(), 'company_admin'::app_role)
    OR public.has_role(auth.uid(), 'supervisor'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = trip_logs.driver_id
      AND d.company_id = public.get_current_company_id()
  )
);

CREATE POLICY trip_logs_company_admin_delete
ON public.trip_logs FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = trip_logs.driver_id
      AND d.company_id = public.get_current_company_id()
  )
);

-- 4. user_roles: prevent company_admin privilege escalation
DROP POLICY IF EXISTS user_roles_company_admin_manage_own_company ON public.user_roles;

CREATE POLICY user_roles_company_admin_manage_own_company
ON public.user_roles FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = public.get_current_company_id()
  AND role IN ('supervisor'::app_role, 'driver'::app_role)
  AND user_id <> auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND company_id IS NOT NULL
  AND company_id = public.get_current_company_id()
  AND role IN ('supervisor'::app_role, 'driver'::app_role)
  AND user_id <> auth.uid()
);

-- 5. storage documents bucket: verify ownership against documents table
DROP POLICY IF EXISTS "Users can view documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents to their company" ON storage.objects;

CREATE POLICY "documents_company_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (public.get_current_company_id())::text
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.storage_path = storage.objects.name
        AND d.company_id = public.get_current_company_id()
    )
  )
);

CREATE POLICY "documents_company_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (public.get_current_company_id())::text
);

CREATE POLICY "documents_company_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (public.get_current_company_id())::text
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.get_current_company_id()
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (public.get_current_company_id())::text
);

CREATE POLICY "documents_company_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (public.get_current_company_id())::text
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = storage.objects.name
      AND d.company_id = public.get_current_company_id()
  )
);