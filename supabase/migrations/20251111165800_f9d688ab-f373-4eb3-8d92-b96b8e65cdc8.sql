-- Drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_company_id uuid;
  v_company_name text;
  v_subscription_type subscription_type;
  v_is_first_user boolean;
BEGIN
  -- Extract metadata from the new user
  v_role := COALESCE((new.raw_user_meta_data->>'role')::app_role, 'driver'::app_role);
  v_company_name := new.raw_user_meta_data->>'company_name';
  v_subscription_type := COALESCE((new.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type);
  v_is_first_user := COALESCE((new.raw_user_meta_data->>'is_first_user')::boolean, false);

  -- Create profile first
  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    NULL -- Will be set after company creation if needed
  );

  -- Handle company creation for first user (super_admin) or company_admin
  IF v_is_first_user AND v_role = 'super_admin' THEN
    -- First user doesn't need a company
    -- Create user_roles entry without company
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, NULL);
    
  ELSIF v_role = 'company_admin' AND v_company_name IS NOT NULL THEN
    -- Create new company for company_admin
    INSERT INTO public.companies (name, subscription_type, created_by)
    VALUES (v_company_name, v_subscription_type, new.id)
    RETURNING id INTO v_company_id;
    
    -- Update profile with company_id
    UPDATE public.profiles
    SET company_id = v_company_id
    WHERE id = new.id;
    
    -- Create user_roles entry with company
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, v_company_id);
    
  ELSE
    -- For other roles (supervisor, driver) - they should be invited and company_id set separately
    -- Just create user_roles entry without company for now
    INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (new.id, v_role, NULL);
  END IF;

  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();