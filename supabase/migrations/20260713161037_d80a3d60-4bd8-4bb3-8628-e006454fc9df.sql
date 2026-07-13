
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
    SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid() AND ur2.role = 'super_admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    c.id AS company_id,
    c.name AS company_name,
    c.logo_url AS company_logo,
    ur.role AS role,
    c.is_active AS is_active,
    c.subscription_type AS subscription_type
  FROM public.user_roles ur
  JOIN public.companies c ON c.id = ur.company_id
  WHERE ur.user_id = p_user_id AND c.is_active = true
  ORDER BY ur.created_at ASC;
END;
$function$;
