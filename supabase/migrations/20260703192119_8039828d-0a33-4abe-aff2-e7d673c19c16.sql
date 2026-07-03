
-- Enable pgcrypto for real encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Storage: remove overly permissive company-logos upload policy
DROP POLICY IF EXISTS "Allow authenticated users to upload company logos" ON storage.objects;

-- 2. security_audit_logs INSERT: scope to caller
DROP POLICY IF EXISTS "Authenticated users can insert security audit logs" ON public.security_audit_logs;
CREATE POLICY "Users can insert own security audit logs"
  ON public.security_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (company_id IS NULL OR company_id = public.get_current_company_id())
  );

-- 3. vehicle_logs INSERT: enforce company match, drop super_admin cross-company bypass
DROP POLICY IF EXISTS "Vehicle logs insert scoped to user company" ON public.vehicle_logs;
CREATE POLICY "Vehicle logs insert scoped to user company"
  ON public.vehicle_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_current_company_id());

-- 4. notification_templates: replace NULL-company exposure with explicit is_system flag
ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS notification_templates_select ON public.notification_templates;
CREATE POLICY notification_templates_select
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_current_company_id()
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (is_system = true AND company_id IS NULL)
  );

-- 5. Integration credentials: restrict SELECT to admins only
DROP POLICY IF EXISTS "Users can view their company's ERP integrations" ON public.erp_integrations;
CREATE POLICY "Admins can view company ERP integrations"
  ON public.erp_integrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
  );

DROP POLICY IF EXISTS "Users can view their company's integrations" ON public.external_integrations;
CREATE POLICY "Admins can view external integrations"
  ON public.external_integrations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::app_role) AND company_id = public.get_current_company_id())
  );

-- 6. Real encryption for credentials (replace base64 placeholder)
CREATE OR REPLACE FUNCTION public.encrypt_credentials(credentials_data jsonb, encryption_key text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := COALESCE(encryption_key, current_setting('app.encryption_key', true));
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured (app.encryption_key)';
  END IF;
  RETURN encode(pgp_sym_encrypt(credentials_data::text, v_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credentials(encrypted_data text, encryption_key text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  v_key := COALESCE(encryption_key, current_setting('app.encryption_key', true));
  IF v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Encryption key not configured (app.encryption_key)';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), v_key)::jsonb;
END;
$$;

-- 7. Revoke EXECUTE on internal security-definer helpers from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.encrypt_credentials(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_credentials(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_integration_credentials(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_integration_credentials(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_table_rls_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_public_table_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_security_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_security_policies() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_automated_backup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_backup(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_backup_integrity(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_super_admin_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_test_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_invitations() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_service_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_error(text, text, text, uuid, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, uuid, uuid, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
