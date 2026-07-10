GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, uuid, text, text, jsonb, text) TO anon;
GRANT EXECUTE ON FUNCTION public.log_error(text, text, text, uuid, uuid, text, text, jsonb) TO anon;