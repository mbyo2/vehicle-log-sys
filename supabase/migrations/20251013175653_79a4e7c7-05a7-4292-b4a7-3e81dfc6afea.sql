-- Only create policies that don't already exist

-- Audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Audit logs are viewable by company admins and super admins'
  ) THEN
    CREATE POLICY "Audit logs are viewable by company admins and super admins"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'super_admin'::app_role) OR
      (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
    );
  END IF;
END
$$;

-- User invitations  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Company admins can manage invitations'
  ) THEN
    CREATE POLICY "Company admins can manage invitations"
    ON public.user_invitations FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- User activity logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_activity_logs' AND policyname = 'Company admins can view company activity logs'
  ) THEN
    CREATE POLICY "Company admins can view company activity logs"
    ON public.user_activity_logs FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Maintenance parts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_parts' AND policyname = 'Maintenance parts manageable by admin and supervisor'
  ) THEN
    CREATE POLICY "Maintenance parts manageable by admin and supervisor"
    ON public.maintenance_parts FOR INSERT TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::app_role) OR
      public.has_role(auth.uid(), 'supervisor'::app_role)
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_parts' AND policyname = 'Maintenance parts updatable by admin and supervisor'
  ) THEN
    CREATE POLICY "Maintenance parts updatable by admin and supervisor"
    ON public.maintenance_parts FOR UPDATE TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) OR
      public.has_role(auth.uid(), 'supervisor'::app_role)
    );
  END IF;
END
$$;

-- Documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Company admins can manage documents'
  ) THEN
    CREATE POLICY "Company admins can manage documents"
    ON public.documents FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Backup logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backup_logs' AND policyname = 'Backup logs viewable by company admins'
  ) THEN
    CREATE POLICY "Backup logs viewable by company admins"
    ON public.backup_logs FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Trip approvals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trip_approvals' AND policyname = 'Supervisors and admins can view approvals'
  ) THEN
    CREATE POLICY "Supervisors and admins can view approvals"
    ON public.trip_approvals FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'supervisor'::app_role) OR
      public.has_role(auth.uid(), 'company_admin'::app_role)
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'trip_approvals' AND policyname = 'Supervisors and admins can insert approvals'
  ) THEN
    CREATE POLICY "Supervisors and admins can insert approvals"
    ON public.trip_approvals FOR INSERT TO authenticated
    WITH CHECK (
      public.has_role(auth.uid(), 'supervisor'::app_role) OR
      public.has_role(auth.uid(), 'company_admin'::app_role)
    );
  END IF;
END
$$;

-- Compliance reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'compliance_reports' AND policyname = 'Compliance reports viewable by company admins and super admins'
  ) THEN
    CREATE POLICY "Compliance reports viewable by company admins and super admins"
    ON public.compliance_reports FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'super_admin'::app_role) OR
      (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'compliance_reports' AND policyname = 'Compliance reports manageable by company admins'
  ) THEN
    CREATE POLICY "Compliance reports manageable by company admins"
    ON public.compliance_reports FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Advertisements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'Super admin can do everything with advertisements'
  ) THEN
    CREATE POLICY "Super admin can do everything with advertisements"
    ON public.advertisements FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'advertisements' AND policyname = 'Company admins can view their own advertisements'
  ) THEN
    CREATE POLICY "Company admins can view their own advertisements"
    ON public.advertisements FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Continue with remaining policies in next migration...