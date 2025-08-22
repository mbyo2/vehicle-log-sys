-- Fix search_path for remaining security functions
CREATE OR REPLACE FUNCTION public.encrypt_credentials(credentials_data jsonb, encryption_key text DEFAULT 'default_key'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN encode(credentials_data::text::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credentials(encrypted_data text, encryption_key text DEFAULT 'default_key'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN decode(encrypted_data, 'base64')::text::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_integration_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'integration_credentials_access',
    auth.uid(),
    COALESCE(NEW.company_id, OLD.company_id),
    jsonb_build_object(
      'action', TG_OP,
      'integration_type', COALESCE(NEW.system_type, OLD.system_type, NEW.type, OLD.type),
      'integration_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    ),
    'high'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF auth.uid() != COALESCE(NEW.id, OLD.id) THEN
    INSERT INTO security_audit_logs (
      event_type, user_id, company_id, event_data, risk_level
    ) VALUES (
      'profile_data_access',
      auth.uid(),
      (SELECT company_id FROM profiles WHERE id = auth.uid()),
      jsonb_build_object(
        'action', TG_OP,
        'target_profile', COALESCE(NEW.id, OLD.id),
        'updated_data', CASE 
          WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)
          ELSE NULL
        END,
        'timestamp', now()
      ),
      'medium'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_mfa_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'mfa_secret_access',
    auth.uid(),
    (SELECT company_id FROM profiles WHERE id = auth.uid()),
    jsonb_build_object(
      'action', TG_OP,
      'target_user', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', now()
    ),
    'high'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.encrypt_integration_credentials(credentials_data jsonb)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      credentials_data::text,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_integration_credentials(encrypted_data text)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    current_setting('app.encryption_key', true)
  )::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_vehicle_data_access()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'vehicle_data_modification',
    auth.uid(),
    (SELECT company_id FROM profiles WHERE id = auth.uid()),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'vehicle_id', COALESCE(NEW.id, OLD.id, NEW.vehicle_id, OLD.vehicle_id),
      'timestamp', now()
    ),
    'medium'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;