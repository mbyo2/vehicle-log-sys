-- Final security fixes - address remaining function search path warnings

-- Fix remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Ensure all integration credentials are properly encrypted
UPDATE public.erp_integrations 
SET encrypted_credentials = public.encrypt_sensitive_data(credentials::text)
WHERE encrypted_credentials IS NULL AND credentials IS NOT NULL;

UPDATE public.external_integrations 
SET encrypted_config = public.encrypt_sensitive_data(config::text)
WHERE encrypted_config IS NULL AND config IS NOT NULL;

-- Create policy enforcement function
CREATE OR REPLACE FUNCTION public.enforce_security_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function can be called periodically to enforce security policies
  -- Log any policy violations or security concerns
  
  INSERT INTO security_events (
    event_type,
    event_details,
    risk_score
  )
  SELECT 
    'policy_check',
    jsonb_build_object(
      'check_time', now(),
      'expired_sessions', (
        SELECT COUNT(*) FROM user_sessions 
        WHERE expires_at < now() AND is_active = true
      )
    ),
    10;
    
  -- Deactivate expired sessions
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Create comprehensive audit view for super admins
CREATE OR REPLACE VIEW public.security_overview AS
SELECT 
  'active_sessions' as metric,
  COUNT(*)::text as value,
  'Current active user sessions' as description
FROM user_sessions 
WHERE is_active = true AND expires_at > now()

UNION ALL

SELECT 
  'recent_events' as metric,
  COUNT(*)::text as value,
  'Security events in last 24 hours' as description
FROM security_events 
WHERE created_at > now() - interval '24 hours'

UNION ALL

SELECT 
  'high_risk_events' as metric,
  COUNT(*)::text as value,
  'High risk events in last 7 days' as description
FROM security_events 
WHERE created_at > now() - interval '7 days' AND risk_score >= 80

UNION ALL

SELECT 
  'mfa_enabled_users' as metric,
  COUNT(*)::text as value,
  'Users with MFA enabled' as description
FROM profiles p
JOIN user_mfa_secrets m ON p.id = m.user_id
WHERE m.verified_at IS NOT NULL;

-- Grant select access to security overview for admins
CREATE POLICY "security_overview_admin_access" 
ON public.security_overview 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['super_admin'::user_role, 'company_admin'::user_role]));

ALTER VIEW public.security_overview OWNER TO postgres;