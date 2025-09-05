-- Fix the security overview query and complete the security setup

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

-- Create policy enforcement function
CREATE OR REPLACE FUNCTION public.enforce_security_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log policy check
  INSERT INTO security_events (
    event_type,
    event_details,
    risk_score
  )
  VALUES (
    'policy_check',
    jsonb_build_object(
      'check_time', now(),
      'expired_sessions_found', (
        SELECT COUNT(*) FROM user_sessions 
        WHERE expires_at < now() AND is_active = true
      )
    ),
    10
  );
    
  -- Deactivate expired sessions
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Ensure integration credentials security
DO $$
BEGIN
  -- Check if we need to encrypt any existing credentials
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'erp_integrations' AND table_schema = 'public'
  ) THEN
    UPDATE public.erp_integrations 
    SET encrypted_credentials = public.encrypt_sensitive_data(credentials::text)
    WHERE encrypted_credentials IS NULL AND credentials IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'external_integrations' AND table_schema = 'public'
  ) THEN
    UPDATE public.external_integrations 
    SET encrypted_config = public.encrypt_sensitive_data(config::text)
    WHERE encrypted_config IS NULL AND config IS NOT NULL;
  END IF;
END $$;

-- Create a comprehensive security metrics function
CREATE OR REPLACE FUNCTION public.get_security_metrics()
RETURNS TABLE(
  metric_name TEXT,
  metric_value BIGINT,
  metric_description TEXT,
  risk_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH security_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE is_active = true AND expires_at > now()) as active_sessions,
      COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as recent_events,
      COUNT(*) FILTER (WHERE created_at > now() - interval '7 days' AND risk_score >= 80) as high_risk_events,
      COUNT(*) FILTER (WHERE event_type LIKE '%signin_failed%' AND created_at > now() - interval '24 hours') as failed_logins
    FROM user_sessions us
    FULL OUTER JOIN security_events se ON true
  )
  SELECT 
    'Active Sessions'::TEXT,
    COALESCE(ss.active_sessions, 0),
    'Current active user sessions'::TEXT,
    CASE 
      WHEN COALESCE(ss.active_sessions, 0) > 100 THEN 'high'
      WHEN COALESCE(ss.active_sessions, 0) > 50 THEN 'medium'
      ELSE 'low'
    END::TEXT
  FROM security_stats ss
  
  UNION ALL
  
  SELECT 
    'Recent Events'::TEXT,
    COALESCE(ss.recent_events, 0),
    'Security events in last 24 hours'::TEXT,
    CASE 
      WHEN COALESCE(ss.recent_events, 0) > 1000 THEN 'high'
      WHEN COALESCE(ss.recent_events, 0) > 100 THEN 'medium'
      ELSE 'low'
    END::TEXT
  FROM security_stats ss
  
  UNION ALL
  
  SELECT 
    'High Risk Events'::TEXT,
    COALESCE(ss.high_risk_events, 0),
    'High risk events in last 7 days'::TEXT,
    CASE 
      WHEN COALESCE(ss.high_risk_events, 0) > 10 THEN 'high'
      WHEN COALESCE(ss.high_risk_events, 0) > 5 THEN 'medium'
      ELSE 'low'
    END::TEXT
  FROM security_stats ss
  
  UNION ALL
  
  SELECT 
    'Failed Logins'::TEXT,
    COALESCE(ss.failed_logins, 0),
    'Failed login attempts in last 24 hours'::TEXT,
    CASE 
      WHEN COALESCE(ss.failed_logins, 0) > 50 THEN 'high'
      WHEN COALESCE(ss.failed_logins, 0) > 10 THEN 'medium'
      ELSE 'low'
    END::TEXT
  FROM security_stats ss;
END;
$$;