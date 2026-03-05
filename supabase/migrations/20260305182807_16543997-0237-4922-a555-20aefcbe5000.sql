
CREATE OR REPLACE FUNCTION public.get_security_metrics()
 RETURNS TABLE(metric_name text, metric_value bigint, metric_description text, risk_level text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'Active Sessions'::TEXT as metric_name,
    COALESCE((SELECT COUNT(*) FROM user_sessions WHERE is_active = true AND expires_at > now()), 0)::BIGINT as metric_value,
    'Current active user sessions'::TEXT as metric_description,
    CASE 
      WHEN COALESCE((SELECT COUNT(*) FROM user_sessions WHERE is_active = true AND expires_at > now()), 0) > 100 THEN 'high'
      WHEN COALESCE((SELECT COUNT(*) FROM user_sessions WHERE is_active = true AND expires_at > now()), 0) > 50 THEN 'medium'
      ELSE 'low'
    END::TEXT as risk_level
  
  UNION ALL
  
  SELECT 
    'Recent Events'::TEXT,
    COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '24 hours'), 0)::BIGINT,
    'Security events in last 24 hours'::TEXT,
    CASE 
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '24 hours'), 0) > 1000 THEN 'high'
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '24 hours'), 0) > 100 THEN 'medium'
      ELSE 'low'
    END::TEXT
  
  UNION ALL
  
  SELECT 
    'High Risk Events'::TEXT,
    COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '7 days' AND risk_score >= 80), 0)::BIGINT,
    'High risk events in last 7 days'::TEXT,
    CASE 
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '7 days' AND risk_score >= 80), 0) > 10 THEN 'high'
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE security_events.created_at > now() - interval '7 days' AND risk_score >= 80), 0) > 5 THEN 'medium'
      ELSE 'low'
    END::TEXT
  
  UNION ALL
  
  SELECT 
    'Failed Logins'::TEXT,
    COALESCE((SELECT COUNT(*) FROM security_events WHERE event_type LIKE '%signin_failed%' AND security_events.created_at > now() - interval '24 hours'), 0)::BIGINT,
    'Failed login attempts in last 24 hours'::TEXT,
    CASE 
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE event_type LIKE '%signin_failed%' AND security_events.created_at > now() - interval '24 hours'), 0) > 50 THEN 'high'
      WHEN COALESCE((SELECT COUNT(*) FROM security_events WHERE event_type LIKE '%signin_failed%' AND security_events.created_at > now() - interval '24 hours'), 0) > 10 THEN 'medium'
      ELSE 'low'
    END::TEXT;
END;
$function$;
