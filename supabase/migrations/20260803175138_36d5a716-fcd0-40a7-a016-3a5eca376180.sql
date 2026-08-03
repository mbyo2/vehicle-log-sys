CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
  v_company_id uuid;
  v_company_name text;
  v_subscription_type subscription_type;
  v_super_admin_exists boolean;
BEGIN
  v_role := COALESCE((new.raw_user_meta_data->>'role')::app_role, 'driver'::app_role);
  v_company_name := new.raw_user_meta_data->>'company_name';
  v_subscription_type := COALESCE((new.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type);

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin'::app_role)
    INTO v_super_admin_exists;

  -- Never trust client-supplied is_first_user: only allow super_admin when none exists.
  IF v_role = 'super_admin'::app_role AND v_super_admin_exists THEN
    v_role := 'driver'::app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', NULL);

  IF v_role = 'super_admin'::app_role THEN
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, NULL);

  ELSIF v_role = 'company_admin'::app_role AND v_company_name IS NOT NULL THEN
    INSERT INTO public.companies (name, subscription_type, trial_start_date, trial_end_date, created_by)
    VALUES (
      v_company_name,
      v_subscription_type,
      CASE WHEN v_subscription_type = 'trial' THEN now() ELSE NULL END,
      CASE WHEN v_subscription_type = 'trial' THEN now() + interval '25 days' ELSE NULL END,
      new.id
    )
    RETURNING id INTO v_company_id;

    UPDATE public.profiles SET company_id = v_company_id WHERE id = new.id;

    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, v_company_id);

  ELSE
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, NULL);
  END IF;

  RETURN new;
END;
$function$;