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

-- Create trigger to log vehicle data access (only for modification operations)
CREATE OR REPLACE FUNCTION log_vehicle_data_access()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for vehicle data modification logging
DROP TRIGGER IF EXISTS log_vehicle_modifications ON vehicles;
CREATE TRIGGER log_vehicle_modifications
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

DROP TRIGGER IF EXISTS log_vehicle_logs_modifications ON vehicle_logs;
CREATE TRIGGER log_vehicle_logs_modifications
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_logs
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

DROP TRIGGER IF EXISTS log_vehicle_services_modifications ON vehicle_services;
CREATE TRIGGER log_vehicle_services_modifications
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_services
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_data_access();

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