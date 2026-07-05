
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.proname, r.args);
  END LOOP;
END $$;

-- RLS helpers (called during signed-in queries)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_super_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_for_company(uuid, uuid) TO authenticated;

-- Client RPC calls
GRANT EXECUTE ON FUNCTION public.check_if_first_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_companies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_backup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error(text, text, text, uuid, uuid, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, uuid, text, text, jsonb, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_document_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_preferences(uuid, uuid) TO authenticated;
