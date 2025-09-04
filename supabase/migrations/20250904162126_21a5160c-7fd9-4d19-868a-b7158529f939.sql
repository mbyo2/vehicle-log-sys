-- Fix critical security issues and enhance authentication/authorization

-- 1. Create missing MFA tables with proper security
CREATE TABLE IF NOT EXISTS public.user_mfa_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  encrypted_secret TEXT NOT NULL,
  backup_codes TEXT[], -- Encrypted backup codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.two_factor_backup_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL, -- Hash of the backup code
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on MFA tables
ALTER TABLE public.user_mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

-- 2. Create secure policies for MFA tables - users can only access their own MFA data
CREATE POLICY "Users can manage their own MFA secrets" 
ON public.user_mfa_secrets 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own backup codes" 
ON public.two_factor_backup_codes 
FOR ALL 
USING (auth.uid() = user_id);

-- 3. Fix profile access policies to be more restrictive
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- More restrictive profile policies
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Company admins can view their company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_current_user_role() = 'company_admin'::user_role 
  AND company_id = get_current_company_id()
  AND company_id IS NOT NULL
);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (get_current_user_role() = 'super_admin'::user_role);

-- 4. Create session management table for enhanced security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Create enhanced audit logging for security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "Company admins can view their company's security events" 
ON public.security_events 
FOR SELECT 
USING (
  get_current_user_role() = 'company_admin'::user_role 
  AND user_id IN (
    SELECT id FROM profiles 
    WHERE company_id = get_current_company_id()
  )
);

-- 6. Create role-based workflow states
CREATE TABLE IF NOT EXISTS public.workflow_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'trip', 'document', 'maintenance', etc.
  entity_id UUID NOT NULL,
  current_state TEXT NOT NULL,
  assigned_to UUID, -- User responsible for next action
  company_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company workflow states" 
ON public.workflow_states 
FOR SELECT 
USING (company_id = get_current_company_id());

CREATE POLICY "Authorized users can manage workflow states" 
ON public.workflow_states 
FOR ALL 
USING (
  company_id = get_current_company_id() 
  AND get_current_user_role() = ANY(ARRAY['super_admin'::user_role, 'company_admin'::user_role, 'supervisor'::user_role])
);

-- 7. Create permission matrix table for granular access control
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL, -- 'vehicles', 'drivers', 'trips', etc.
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve'
  company_id UUID, -- NULL for system-wide permissions
  is_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, resource, action, is_granted) VALUES
-- Super Admin - full access to everything
('super_admin', 'companies', 'create', true),
('super_admin', 'companies', 'read', true),
('super_admin', 'companies', 'update', true),
('super_admin', 'companies', 'delete', true),
('super_admin', 'users', 'create', true),
('super_admin', 'users', 'read', true),
('super_admin', 'users', 'update', true),
('super_admin', 'users', 'delete', true),

-- Company Admin - full access within company
('company_admin', 'vehicles', 'create', true),
('company_admin', 'vehicles', 'read', true),
('company_admin', 'vehicles', 'update', true),
('company_admin', 'vehicles', 'delete', true),
('company_admin', 'drivers', 'create', true),
('company_admin', 'drivers', 'read', true),
('company_admin', 'drivers', 'update', true),
('company_admin', 'trips', 'read', true),
('company_admin', 'trips', 'approve', true),
('company_admin', 'reports', 'read', true),

-- Supervisor - manage drivers and trips
('supervisor', 'drivers', 'read', true),
('supervisor', 'drivers', 'update', true),
('supervisor', 'vehicles', 'read', true),
('supervisor', 'trips', 'read', true),
('supervisor', 'trips', 'approve', true),
('supervisor', 'reports', 'read', true),

-- Driver - limited access to own data
('driver', 'trips', 'create', true),
('driver', 'trips', 'read', true),
('driver', 'vehicles', 'read', true),
('driver', 'profile', 'update', true);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::user_role, 'company_admin'::user_role]));

-- 8. Create function to check permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_resource TEXT,
  p_action TEXT,
  p_company_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
  has_permission BOOLEAN := false;
BEGIN
  -- Get current user role
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has permission
  SELECT is_granted INTO has_permission
  FROM role_permissions
  WHERE role = user_role
    AND resource = p_resource
    AND action = p_action
    AND (company_id IS NULL OR company_id = p_company_id);
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- 9. Create function for secure credential encryption
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  data_text TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use a more secure encryption method
  RETURN encode(digest(data_text || current_setting('app.jwt_secret', true), 'sha256'), 'hex');
END;
$$;

-- 10. Add triggers for audit logging
CREATE OR REPLACE FUNCTION public.log_security_event_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_events (
    user_id, 
    event_type, 
    event_details
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME || '_' || TG_OP,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply security logging to sensitive tables
CREATE TRIGGER profiles_security_log AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_security_event_trigger();

CREATE TRIGGER companies_security_log AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION log_security_event_trigger();