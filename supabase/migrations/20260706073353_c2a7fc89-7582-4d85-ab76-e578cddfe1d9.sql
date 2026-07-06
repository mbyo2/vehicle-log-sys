
-- 1. Revoke default PUBLIC/anon/authenticated execute on all public functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
  END LOOP;
END $$;

-- 2. service_role keeps full access (edge functions)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Selectively re-grant to authenticated (RLS helpers + client RPCs)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_primary_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_super_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.should_send_notification(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_preferences(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_document_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_companies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_for_company(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_backup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_error(text, text, text, uuid, uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, uuid, text, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;

-- 4. Re-grant to anon for pre-auth flows
GRANT EXECUTE ON FUNCTION public.check_if_first_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, uuid, text, text, jsonb, text) TO anon;
