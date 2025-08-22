-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop overly permissive RLS policies on vehicles table
DROP POLICY IF EXISTS "Vehicles are viewable by authenticated users" ON vehicles;

-- Drop overly permissive policies on vehicle_logs table  
DROP POLICY IF EXISTS "Vehicle logs are viewable by authenticated users" ON vehicle_logs;
DROP POLICY IF EXISTS "Vehicle logs are insertable by authenticated users" ON vehicle_logs;

-- Drop overly permissive policy on vehicle_services table
DROP POLICY IF EXISTS "Vehicle services viewable by authenticated users" ON vehicle_services;

-- Create proper company-scoped RLS policies for vehicles
CREATE POLICY "Users can view vehicles from their company" ON vehicles
FOR SELECT USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage vehicles in their company" ON vehicles
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_admin', 'supervisor', 'super_admin')
  )
);

-- Create proper company-scoped RLS policies for vehicle_logs
CREATE POLICY "Users can view vehicle logs from their company" ON vehicle_logs
FOR SELECT USING (
  vehicle_id IN (
    SELECT v.id FROM vehicles v
    JOIN profiles p ON p.company_id = v.company_id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert vehicle logs for their company vehicles" ON vehicle_logs
FOR INSERT WITH CHECK (
  vehicle_id IN (
    SELECT v.id FROM vehicles v
    JOIN profiles p ON p.company_id = v.company_id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Admins can manage vehicle logs in their company" ON vehicle_logs
FOR ALL USING (
  vehicle_id IN (
    SELECT v.id FROM vehicles v
    JOIN profiles p ON p.company_id = v.company_id
    WHERE p.id = auth.uid() 
    AND p.role IN ('company_admin', 'supervisor', 'super_admin')
  )
);

-- Create proper company-scoped RLS policies for vehicle_services
CREATE POLICY "Users can view vehicle services from their company" ON vehicle_services
FOR SELECT USING (
  vehicle_id IN (
    SELECT v.id FROM vehicles v
    JOIN profiles p ON p.company_id = v.company_id
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Admins can manage vehicle services in their company" ON vehicle_services
FOR ALL USING (
  vehicle_id IN (
    SELECT v.id FROM vehicles v
    JOIN profiles p ON p.company_id = v.company_id
    WHERE p.id = auth.uid() 
    AND p.role IN ('company_admin', 'supervisor', 'super_admin')
  )
);

-- Create encryption functions for integration credentials
CREATE OR REPLACE FUNCTION encrypt_integration_credentials(credentials_data jsonb)
RETURNS text AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      credentials_data::text,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_integration_credentials(encrypted_data text)
RETURNS jsonb AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    current_setting('app.encryption_key', true)
  )::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add encrypted credentials column to erp_integrations
ALTER TABLE erp_integrations ADD COLUMN IF NOT EXISTS encrypted_credentials text;

-- Add encrypted config column to external_integrations  
ALTER TABLE external_integrations ADD COLUMN IF NOT EXISTS encrypted_config text;

-- Create trigger to log vehicle data access
CREATE OR REPLACE FUNCTION log_vehicle_data_access()
RETURNS trigger AS $$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'vehicle_data_access',
    auth.uid(),
    (SELECT company_id FROM profiles WHERE id = auth.uid()),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'vehicle_id', COALESCE(NEW.id, OLD.id, NEW.vehicle_id, OLD.vehicle_id),
      'timestamp', now()
    ),
    'low'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for vehicle data access logging
DROP TRIGGER IF EXISTS log_vehicle_access ON vehicles;
CREATE TRIGGER log_vehicle_access
  AFTER SELECT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

DROP TRIGGER IF EXISTS log_vehicle_logs_access ON vehicle_logs;
CREATE TRIGGER log_vehicle_logs_access
  AFTER SELECT OR UPDATE OR DELETE ON vehicle_logs
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

DROP TRIGGER IF EXISTS log_vehicle_services_access ON vehicle_services;
CREATE TRIGGER log_vehicle_services_access
  AFTER SELECT OR UPDATE OR DELETE ON vehicle_services
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_record auth_rate_limits%ROWTYPE;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT * INTO current_record
  FROM auth_rate_limits
  WHERE user_identifier = p_identifier 
  AND action_type = p_action_type;
  
  IF current_record IS NULL THEN
    INSERT INTO auth_rate_limits (user_identifier, action_type, attempt_count, window_start)
    VALUES (p_identifier, p_action_type, 1, now());
    RETURN TRUE;
  END IF;
  
  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > now() THEN
    RETURN FALSE;
  END IF;
  
  IF current_record.window_start < window_start_time THEN
    UPDATE auth_rate_limits
    SET attempt_count = 1, window_start = now(), blocked_until = NULL
    WHERE user_identifier = p_identifier AND action_type = p_action_type;
    RETURN TRUE;
  END IF;
  
  UPDATE auth_rate_limits
  SET attempt_count = attempt_count + 1,
      blocked_until = CASE 
        WHEN attempt_count + 1 >= p_max_attempts 
        THEN now() + (p_window_minutes || ' minutes')::INTERVAL
        ELSE NULL
      END
  WHERE user_identifier = p_identifier AND action_type = p_action_type;
  
  RETURN (current_record.attempt_count + 1) < p_max_attempts;
END;
$$;

-- Enhanced rate limiting for vehicle operations
CREATE OR REPLACE FUNCTION check_vehicle_rate_limit()
RETURNS trigger AS $$
BEGIN
  IF NOT check_rate_limit(
    auth.uid()::text || '_vehicle_ops',
    TG_OP,
    10, -- 10 operations
    5   -- per 5 minutes
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for vehicle operations';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Add rate limiting triggers
DROP TRIGGER IF EXISTS vehicle_rate_limit ON vehicles;
CREATE TRIGGER vehicle_rate_limit
  BEFORE INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_rate_limit();

DROP TRIGGER IF EXISTS vehicle_logs_rate_limit ON vehicle_logs;
CREATE TRIGGER vehicle_logs_rate_limit
  BEFORE INSERT OR UPDATE OR DELETE ON vehicle_logs
  FOR EACH ROW EXECUTE FUNCTION check_vehicle_rate_limit();