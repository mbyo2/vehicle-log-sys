-- Fix remaining functions without search_path

-- Fix check_rate_limit function
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer);
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

-- Fix get_secure_document_url function
DROP FUNCTION IF EXISTS public.get_secure_document_url(text);
CREATE OR REPLACE FUNCTION public.get_secure_document_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  document_record record;
  user_profile record;
BEGIN
  -- Get document info
  SELECT * INTO document_record
  FROM documents
  WHERE documents.storage_path = get_secure_document_url.storage_path;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check access permissions
  IF user_profile.role != 'super_admin'::user_role AND 
     user_profile.company_id != document_record.company_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return storage path for signed URL generation
  RETURN storage_path;
END;
$function$;