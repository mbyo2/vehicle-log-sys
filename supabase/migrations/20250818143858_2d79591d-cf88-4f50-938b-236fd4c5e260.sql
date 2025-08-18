-- Critical Security Fixes Phase 1: Database Hardening (Fixed)

-- 1. Create missing user_mfa_secrets table with proper RLS if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_mfa_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id)
);

-- Enable RLS on user_mfa_secrets
ALTER TABLE public.user_mfa_secrets ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for MFA secrets
CREATE POLICY "Users can only access their own MFA secrets"
ON public.user_mfa_secrets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix infinite recursion in profiles RLS by using the existing security definer function
DROP POLICY IF EXISTS "Restricted company admin profile access" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view company profiles (restricted)" ON public.profiles;

-- Use the existing get_current_user_role function to avoid recursion
CREATE POLICY "Secure profile access"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  get_current_user_role() = 'super_admin'::user_role OR
  (get_current_user_role() = 'company_admin'::user_role AND company_id = get_current_company_id())
);

-- 3. Add audit logging trigger for MFA access (INSERT/UPDATE/DELETE only)
CREATE OR REPLACE FUNCTION log_mfa_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER mfa_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.user_mfa_secrets
  FOR EACH ROW EXECUTE FUNCTION log_mfa_access();

-- 4. Add audit logging for sensitive profile updates (not SELECT)
CREATE OR REPLACE FUNCTION log_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone updates another user's profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profile_access_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_access();

-- 5. Add encryption functions for integration credentials
CREATE OR REPLACE FUNCTION encrypt_credentials(credentials_data jsonb, encryption_key text DEFAULT 'default_key')
RETURNS text AS $$
BEGIN
  -- In production, use proper encryption. For now, we'll use base64 encoding as placeholder
  -- This should be replaced with proper encryption using pgcrypto or similar
  RETURN encode(credentials_data::text::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_credentials(encrypted_data text, encryption_key text DEFAULT 'default_key')
RETURNS jsonb AS $$
BEGIN
  -- Decrypt the credentials (placeholder implementation)
  RETURN decode(encrypted_data, 'base64')::text::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add enhanced audit logging for integration credential access
CREATE OR REPLACE FUNCTION log_integration_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER erp_integration_access_audit
  AFTER UPDATE ON public.erp_integrations
  FOR EACH ROW EXECUTE FUNCTION log_integration_access();

CREATE TRIGGER external_integration_access_audit
  AFTER UPDATE ON public.external_integrations
  FOR EACH ROW EXECUTE FUNCTION log_integration_access();

-- 7. Add rate limiting for authentication operations
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT NOT NULL, -- email or IP
    action_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset', 'mfa'
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_identifier, action_type)
);

-- Enable RLS on rate limits
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage rate limits
CREATE POLICY "Super admins can manage rate limits"
ON public.auth_rate_limits
FOR ALL
USING (
  get_current_user_role() = 'super_admin'::user_role
);

-- 8. Create function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  current_record auth_rate_limits%ROWTYPE;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current rate limit record
  SELECT * INTO current_record
  FROM auth_rate_limits
  WHERE user_identifier = p_identifier 
  AND action_type = p_action_type;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO auth_rate_limits (user_identifier, action_type, attempt_count, window_start)
    VALUES (p_identifier, p_action_type, 1, now());
    RETURN TRUE;
  END IF;
  
  -- Check if we're still in cooldown period
  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > now() THEN
    RETURN FALSE;
  END IF;
  
  -- Reset counter if window has expired
  IF current_record.window_start < window_start_time THEN
    UPDATE auth_rate_limits
    SET attempt_count = 1, window_start = now(), blocked_until = NULL
    WHERE user_identifier = p_identifier AND action_type = p_action_type;
    RETURN TRUE;
  END IF;
  
  -- Increment attempt count
  UPDATE auth_rate_limits
  SET attempt_count = attempt_count + 1,
      blocked_until = CASE 
        WHEN attempt_count + 1 >= p_max_attempts 
        THEN now() + (p_window_minutes || ' minutes')::INTERVAL
        ELSE NULL
      END
  WHERE user_identifier = p_identifier AND action_type = p_action_type;
  
  -- Return false if limit exceeded
  RETURN (current_record.attempt_count + 1) < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;