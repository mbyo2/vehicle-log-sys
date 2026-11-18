CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  AND (auth.uid() IS NULL OR _user_id = auth.uid()
       OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'))
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND (auth.uid() IS NULL OR _user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'super_admin'))
  ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'company_admin' THEN 2 WHEN 'supervisor' THEN 3 WHEN 'driver' THEN 4 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_has_admin_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id AND role IN ('super_admin'::app_role, 'company_admin'::app_role)
    AND (auth.uid() IS NULL OR _user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'super_admin'))
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.should_send_notification(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification(uuid, uuid, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  rec auth_rate_limits%ROWTYPE;
  v_ip text;
  v_key text;
  v_max int := GREATEST(COALESCE(p_max_attempts, 5), 3);
  v_win int := LEAST(GREATEST(COALESCE(p_window_minutes, 15), 1), 60);
BEGIN
  BEGIN
    v_ip := split_part(COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  EXCEPTION WHEN others THEN v_ip := '';
  END;
  v_key := lower(left(COALESCE(p_identifier, ''), 320)) || '|' || COALESCE(auth.uid()::text, trim(v_ip));
  SELECT * INTO rec FROM auth_rate_limits WHERE user_identifier = v_key AND action_type = left(p_action_type, 64);
  IF NOT FOUND THEN
    INSERT INTO auth_rate_limits (user_identifier, action_type, attempt_count, window_start) VALUES (v_key, left(p_action_type, 64), 1, now());
    RETURN TRUE;
  END IF;
  IF rec.blocked_until IS NOT NULL AND rec.blocked_until > now() THEN RETURN FALSE; END IF;
  IF rec.window_start < now() - make_interval(mins => v_win) THEN
    UPDATE auth_rate_limits SET attempt_count = 1, window_start = now(), blocked_until = NULL WHERE id = rec.id;
    RETURN TRUE;
  END IF;
  UPDATE auth_rate_limits SET attempt_count = attempt_count + 1,
    blocked_until = CASE WHEN attempt_count + 1 > v_max THEN now() + make_interval(mins => v_win) ELSE NULL END
  WHERE id = rec.id;
  RETURN rec.attempt_count + 1 <= v_max;
END;
$function$;