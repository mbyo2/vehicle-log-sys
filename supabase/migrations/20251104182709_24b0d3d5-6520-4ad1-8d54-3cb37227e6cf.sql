-- ============================================
-- CRITICAL: Production-Ready RLS & Functions
-- ============================================

-- 1. Ensure service role can bypass ALL RLS
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;

-- 2. Grant service role full access to user_roles (CRITICAL for triggers)
DROP POLICY IF EXISTS "user_roles_service_role_full_access" ON public.user_roles;
CREATE POLICY "user_roles_service_role_full_access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Allow authenticated users to read their own roles
DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Update check_if_first_user function for reliability
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if any super_admin exists in user_roles table
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE role = 'super_admin'::app_role
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  -- In case of any error, default to false for security
  RETURN false;
END;
$function$;

-- 5. Grant necessary permissions to service_role
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.companies TO service_role;

-- 6. Ensure log_security_event function exists
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_company_id uuid DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}'::jsonb,
  p_risk_level text DEFAULT 'low'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_events (
    event_type, user_id, ip_address, 
    user_agent, event_details, risk_score
  )
  VALUES (
    p_event_type, p_user_id, p_ip_address,
    p_user_agent, p_event_data,
    CASE p_risk_level
      WHEN 'critical' THEN 100
      WHEN 'high' THEN 75
      WHEN 'medium' THEN 50
      WHEN 'low' THEN 25
      ELSE 0
    END
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

-- 7. Verify check_rate_limit function exists
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;