-- Security hardening: Restrict access to sensitive integration and personal data tables

-- 1. Restrict access to ERP integrations (sensitive credentials)
DROP POLICY IF EXISTS "Company admins can manage ERP integrations" ON erp_integrations;
CREATE POLICY "Super admins and authorized company admins can manage ERP integrations"
ON erp_integrations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (
    profiles.role = 'super_admin'::user_role OR 
    (profiles.role = 'company_admin'::user_role AND profiles.company_id = erp_integrations.company_id)
  )
));

-- 2. Restrict access to external integrations (sensitive credentials)
DROP POLICY IF EXISTS "Company admins can manage integrations" ON external_integrations;
CREATE POLICY "Super admins and authorized company admins can manage external integrations"
ON external_integrations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND (
    profiles.role = 'super_admin'::user_role OR 
    (profiles.role = 'company_admin'::user_role AND profiles.company_id = external_integrations.company_id)
  )
));

-- 3. Harden profiles table access - users can only view their own profile unless admin
DROP POLICY IF EXISTS "Company admins can view company profiles" ON profiles;
CREATE POLICY "Company admins can view company profiles (restricted)"
ON profiles
FOR SELECT
USING (
  auth.uid() = id OR  -- Users can always see their own profile
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('super_admin'::user_role, 'company_admin'::user_role)
    AND (p.role = 'super_admin'::user_role OR p.company_id = profiles.company_id)
  )
);

-- 4. Add audit logging for sensitive table access
CREATE OR REPLACE FUNCTION log_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO security_audit_logs (
    event_type, user_id, ip_address, user_agent, event_data, risk_level
  ) VALUES (
    'sensitive_data_access',
    auth.uid(),
    current_setting('request.headers', true)::json->>'cf-connecting-ip',
    current_setting('request.headers', true)::json->>'user-agent',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id)
    ),
    'medium'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables (UPDATE and DELETE only, not SELECT due to performance)
DROP TRIGGER IF EXISTS trg_log_erp_access ON erp_integrations;
CREATE TRIGGER trg_log_erp_access
  AFTER UPDATE OR DELETE ON erp_integrations
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

DROP TRIGGER IF EXISTS trg_log_external_integrations_access ON external_integrations;
CREATE TRIGGER trg_log_external_integrations_access
  AFTER UPDATE OR DELETE ON external_integrations
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_access();

-- 5. Create function to generate secure document URLs
CREATE OR REPLACE FUNCTION get_secure_document_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  document_record record;
  user_profile record;
BEGIN
  -- Get document info
  SELECT * INTO document_record
  FROM documents
  WHERE documents.storage_path = get_secure_document_url.storage_path;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check access permissions
  IF user_profile.role != 'super_admin'::user_role AND 
     user_profile.company_id != document_record.company_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return storage path for signed URL generation
  RETURN storage_path;
END;
$$;