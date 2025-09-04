-- Fix function search path issues and complete security implementation

-- 7. Create role permissions table and permission checker function
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  company_id UUID,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default permissions
INSERT INTO public.role_permissions (role, resource, action, is_granted) VALUES
-- Super Admin permissions
('super_admin', 'companies', 'create', true),
('super_admin', 'companies', 'read', true),
('super_admin', 'companies', 'update', true),
('super_admin', 'companies', 'delete', true),
('super_admin', 'users', 'create', true),
('super_admin', 'users', 'read', true),
('super_admin', 'users', 'update', true),
('super_admin', 'users', 'delete', true),
-- Company Admin permissions
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
-- Supervisor permissions
('supervisor', 'drivers', 'read', true),
('supervisor', 'drivers', 'update', true),
('supervisor', 'vehicles', 'read', true),
('supervisor', 'trips', 'read', true),
('supervisor', 'trips', 'approve', true),
('supervisor', 'reports', 'read', true),
-- Driver permissions
('driver', 'trips', 'create', true),
('driver', 'trips', 'read', true),
('driver', 'vehicles', 'read', true),
('driver', 'profile', 'update', true)
ON CONFLICT DO NOTHING;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_admin_access" 
ON public.role_permissions 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::user_role, 'company_admin'::user_role]));

-- 8. Create function to check permissions with proper search_path
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
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT is_granted INTO has_permission
  FROM role_permissions
  WHERE role = user_role
    AND resource = p_resource
    AND action = p_action
    AND (company_id IS NULL OR company_id = p_company_id);
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- 9. Create secure credential encryption function with proper search_path
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(
  data_text TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(data_text, 'sha256'), 'hex');
END;
$$;

-- 10. Fix existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  is_first_user boolean;
  user_role user_role;
  user_company_id uuid;
  new_company_id uuid;
  company_name text;
  subscription_type subscription_type;
  trial_end_date timestamp with time zone;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first_user FROM profiles;
  
  IF is_first_user THEN
    user_role := 'super_admin'::user_role;
    user_company_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'company_admin'::user_role
    );
    
    IF user_role = 'company_admin' THEN
      SELECT 
        COALESCE((NEW.raw_user_meta_data->>'company_name'), 'New Company'),
        COALESCE((NEW.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
      INTO company_name, subscription_type;
      
      trial_end_date := now() + interval '25 days';
      
      INSERT INTO public.companies (
        name,
        subscription_type,
        trial_start_date,
        trial_end_date,
        created_by,
        is_active
      )
      VALUES (
        company_name,
        subscription_type,
        CASE 
          WHEN subscription_type = 'trial' THEN now() 
          ELSE NULL 
        END,
        CASE 
          WHEN subscription_type = 'trial' THEN trial_end_date 
          ELSE NULL 
        END,
        NEW.id,
        true
      )
      RETURNING id INTO new_company_id;
      
      user_company_id := new_company_id;
    ELSE
      user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_company_id
  );
  
  RETURN NEW;
END;
$$;

-- 11. Create security event logging function with proper search_path
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
DROP TRIGGER IF EXISTS profiles_security_log ON public.profiles;
DROP TRIGGER IF EXISTS companies_security_log ON public.companies;

CREATE TRIGGER profiles_security_log AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_security_event_trigger();

CREATE TRIGGER companies_security_log AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION log_security_event_trigger();