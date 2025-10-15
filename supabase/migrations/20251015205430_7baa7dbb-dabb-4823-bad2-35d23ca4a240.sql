-- Continue creating remaining RLS policies

-- Ad analytics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ad_analytics' AND policyname = 'Super admin and advertisers can view analytics'
  ) THEN
    CREATE POLICY "Super admin and advertisers can view analytics"
    ON public.ad_analytics FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'super_admin'::app_role) OR
      auth.uid() IN (SELECT advertiser_id FROM advertisements WHERE id = ad_analytics.ad_id)
    );
  END IF;
END
$$;

-- IP whitelist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ip_whitelist' AND policyname = 'Super admins can manage all IP whitelist entries'
  ) THEN
    CREATE POLICY "Super admins can manage all IP whitelist entries"
    ON public.ip_whitelist FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ip_whitelist' AND policyname = 'Company admins can manage their company IP whitelist'
  ) THEN
    CREATE POLICY "Company admins can manage their company IP whitelist"
    ON public.ip_whitelist FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Document categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_categories' AND policyname = 'Company admins can manage categories'
  ) THEN
    CREATE POLICY "Company admins can manage categories"
    ON public.document_categories FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Vehicles modifiable by company admin'
  ) THEN
    CREATE POLICY "Vehicles modifiable by company admin"
    ON public.vehicles FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Training courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'training_courses' AND policyname = 'Company admins can manage training courses'
  ) THEN
    CREATE POLICY "Company admins can manage training courses"
    ON public.training_courses FOR ALL TO authenticated
    USING (
      (public.has_role(auth.uid(), 'company_admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Driver trainings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'driver_trainings' AND policyname = 'Company admins can manage driver trainings'
  ) THEN
    CREATE POLICY "Company admins can manage driver trainings"
    ON public.driver_trainings FOR ALL TO authenticated
    USING (
      (public.has_role(auth.uid(), 'company_admin'::app_role) OR 
       public.has_role(auth.uid(), 'supervisor'::app_role) OR 
       public.has_role(auth.uid(), 'super_admin'::app_role)) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Security audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'Super admins can view all security audit logs'
  ) THEN
    CREATE POLICY "Super admins can view all security audit logs"
    ON public.security_audit_logs FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'Company admins can view company security audit logs'
  ) THEN
    CREATE POLICY "Company admins can view company security audit logs"
    ON public.security_audit_logs FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Error logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Super admins can manage all error logs'
  ) THEN
    CREATE POLICY "Super admins can manage all error logs"
    ON public.error_logs FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Company admins can view company error logs'
  ) THEN
    CREATE POLICY "Company admins can view company error logs"
    ON public.error_logs FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- System health logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'system_health_logs' AND policyname = 'Super admins can manage system health logs'
  ) THEN
    CREATE POLICY "Super admins can manage system health logs"
    ON public.system_health_logs FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

-- Security audit results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_results' AND policyname = 'Super admins can manage security audit results'
  ) THEN
    CREATE POLICY "Super admins can manage security audit results"
    ON public.security_audit_results FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_results' AND policyname = 'Company admins can view audit results'
  ) THEN
    CREATE POLICY "Company admins can view audit results"
    ON public.security_audit_results FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'company_admin'::app_role) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Security policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_policies' AND policyname = 'Company admins can manage security policies'
  ) THEN
    CREATE POLICY "Company admins can manage security policies"
    ON public.security_policies FOR ALL TO authenticated
    USING (
      (public.has_role(auth.uid(), 'company_admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- Security policy config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_policy_config' AND policyname = 'Company admins can manage security policy config'
  ) THEN
    CREATE POLICY "Company admins can manage security policy config"
    ON public.security_policy_config FOR ALL TO authenticated
    USING (
      (public.has_role(auth.uid(), 'company_admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)) AND
      company_id = public.get_current_company_id()
    );
  END IF;
END
$$;

-- ERP integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'erp_integrations' AND policyname = 'Admins can manage ERP integrations'
  ) THEN
    CREATE POLICY "Admins can manage ERP integrations"
    ON public.erp_integrations FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'super_admin'::app_role) OR
      (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
    );
  END IF;
END
$$;

-- External integrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'external_integrations' AND policyname = 'Admins can manage external integrations'
  ) THEN
    CREATE POLICY "Admins can manage external integrations"
    ON public.external_integrations FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'super_admin'::app_role) OR
      (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
    );
  END IF;
END
$$;

-- Vehicle logs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_logs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_logs' AND policyname = 'Admins can manage vehicle logs'
    ) THEN
      EXECUTE 'CREATE POLICY "Admins can manage vehicle logs"
      ON public.vehicle_logs FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), ''company_admin''::app_role) AND
        company_id = public.get_current_company_id()
      )';
    END IF;
  END IF;
END
$$;

-- Vehicle services (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_services') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_services' AND policyname = 'Admins can manage vehicle services'
    ) THEN
      EXECUTE 'CREATE POLICY "Admins can manage vehicle services"
      ON public.vehicle_services FOR ALL TO authenticated
      USING (
        public.has_role(auth.uid(), ''company_admin''::app_role) AND
        company_id = public.get_current_company_id()
      )';
    END IF;
  END IF;
END
$$;

-- Storage policies for company logos (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Company admins can manage company logos'
  ) THEN
    CREATE POLICY "Company admins can manage company logos"
    ON storage.objects FOR ALL TO authenticated
    USING (
      bucket_id = 'company-logos' AND
      public.has_role(auth.uid(), 'company_admin'::app_role)
    );
  END IF;
END
$$;