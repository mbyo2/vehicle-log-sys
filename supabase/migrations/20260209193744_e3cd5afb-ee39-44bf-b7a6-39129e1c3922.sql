-- Fix get_secure_document_url to use app_role instead of user_role
CREATE OR REPLACE FUNCTION public.get_secure_document_url(storage_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  document_record record;
  user_company_id uuid;
  is_super boolean;
BEGIN
  SELECT * INTO document_record FROM documents WHERE documents.storage_path = get_secure_document_url.storage_path;
  IF NOT FOUND THEN RAISE EXCEPTION 'Document not found'; END IF;
  
  SELECT company_id INTO user_company_id FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'User not authenticated'; END IF;
  
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role) INTO is_super;
  
  IF NOT is_super AND user_company_id != document_record.company_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN storage_path;
END;
$$;

-- Fix user_has_permission to use app_role
CREATE OR REPLACE FUNCTION public.user_has_permission(p_resource text, p_action text, p_company_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  has_perm BOOLEAN := false;
BEGIN
  SELECT role INTO v_role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF v_role IS NULL THEN RETURN false; END IF;
  
  SELECT is_granted INTO has_perm FROM role_permissions
  WHERE role = v_role AND resource = p_resource AND action = p_action
  AND (company_id IS NULL OR company_id = p_company_id);
  
  RETURN COALESCE(has_perm, false);
END;
$$;