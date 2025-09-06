-- Phase 1: Critical RLS Policy Consolidation & Database Security Hardening (Fixed)

-- Fix function search_path issues for security functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role')::user_role,
      CASE 
        WHEN NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN 'super_admin'::user_role
        ELSE 'driver'::user_role
      END
    )
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$function$;

-- Consolidate overlapping RLS policies for profiles table
DROP POLICY IF EXISTS "profile_own_access" ON public.profiles;
DROP POLICY IF EXISTS "profile_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profile_company_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profile_super_admin_access" ON public.profiles;
DROP POLICY IF EXISTS "profile_super_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile access" ON public.profiles;

-- Create consolidated profile policies
CREATE POLICY "profiles_read_access" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  get_current_user_role() = 'super_admin'::user_role OR
  (get_current_user_role() = 'company_admin'::user_role AND company_id = get_current_company_id())
);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_super_admin_manage" ON public.profiles
FOR ALL
USING (get_current_user_role() = 'super_admin'::user_role)
WITH CHECK (get_current_user_role() = 'super_admin'::user_role);

-- Add security event logging for credential access
CREATE OR REPLACE FUNCTION public.log_credential_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'credentials_accessed',
    auth.uid(),
    COALESCE(NEW.company_id, OLD.company_id),
    jsonb_build_object(
      'action', TG_OP,
      'integration_type', COALESCE(NEW.type, OLD.type, NEW.system_type, OLD.system_type),
      'integration_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    ),
    'high'
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;