
-- 1. Restrict get_user_companies to self or super_admin
CREATE OR REPLACE FUNCTION public.get_user_companies(p_user_id uuid)
 RETURNS TABLE(company_id uuid, company_name text, company_logo text, role app_role, is_active boolean, subscription_type subscription_type)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.id, c.name, c.logo_url, ur.role, c.is_active, c.subscription_type
  FROM public.user_roles ur
  JOIN public.companies c ON c.id = ur.company_id
  WHERE ur.user_id = p_user_id AND c.is_active = true
  ORDER BY ur.created_at ASC;
END;
$function$;

-- 2. Restrict get_user_role_for_company to self or admins scoped to that company
CREATE OR REPLACE FUNCTION public.get_user_role_for_company(p_user_id uuid, p_company_id uuid)
 RETURNS app_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_user_id <> auth.uid()
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role)
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'company_admin'::app_role AND company_id = p_company_id)
  THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT role INTO v_role FROM public.user_roles
  WHERE user_id = p_user_id AND company_id = p_company_id
  LIMIT 1;
  RETURN v_role;
END;
$function$;

-- 3. backup_logs: restrict writes to service_role only
DROP POLICY IF EXISTS "backup_logs_service_role_insert" ON public.backup_logs;
DROP POLICY IF EXISTS "backup_logs_service_role_update" ON public.backup_logs;
DROP POLICY IF EXISTS "backup_logs_service_role_delete" ON public.backup_logs;

CREATE POLICY "backup_logs_service_role_insert" ON public.backup_logs
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "backup_logs_service_role_update" ON public.backup_logs
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "backup_logs_service_role_delete" ON public.backup_logs
  FOR DELETE TO service_role USING (true);

-- 4. documents: consolidate overlapping SELECT policies
DROP POLICY IF EXISTS "Users can read documents from their company" ON public.documents;
DROP POLICY IF EXISTS "Users can view documents in their categories" ON public.documents;
DROP POLICY IF EXISTS "Users can view their company's documents" ON public.documents;

CREATE POLICY "Users can view documents in their company" ON public.documents
  FOR SELECT TO authenticated
  USING (company_id = public.get_current_company_id());

-- 5. user_sessions: owner-scoped write policies
DROP POLICY IF EXISTS "sessions_user_insert" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_user_update" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_user_delete" ON public.user_sessions;
DROP POLICY IF EXISTS "sessions_service_role_all" ON public.user_sessions;

CREATE POLICY "sessions_user_insert" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_user_update" ON public.user_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_user_delete" ON public.user_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_service_role_all" ON public.user_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
