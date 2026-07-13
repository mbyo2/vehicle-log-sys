
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
  v_is_first_user boolean;
BEGIN
  v_role := COALESCE((new.raw_user_meta_data->>'role')::app_role, 'driver'::app_role);
  v_company_name := new.raw_user_meta_data->>'company_name';
  v_subscription_type := COALESCE((new.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type);
  v_is_first_user := COALESCE((new.raw_user_meta_data->>'is_first_user')::boolean, false);

  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', NULL);

  IF v_is_first_user AND v_role = 'super_admin' THEN
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, NULL);

  ELSIF v_role = 'company_admin' AND v_company_name IS NOT NULL THEN
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

-- Allow super_admin to view all vehicles
DROP POLICY IF EXISTS "vehicles_select_super_admin" ON public.vehicles;
CREATE POLICY "vehicles_select_super_admin" ON public.vehicles
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
