-- Fix the handle_new_user trigger to avoid constraint violations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_first_user boolean;
  user_role user_role;
  user_company_id uuid;
  new_company_id uuid;
  company_name text;
  subscription_type subscription_type;
  trial_end_date timestamp with time zone;
BEGIN
  -- Check if this is the first user by counting existing profiles
  SELECT COUNT(*) = 0 INTO is_first_user FROM profiles;
  
  -- Determine role
  IF is_first_user THEN
    user_role := 'super_admin'::user_role;
    user_company_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'company_admin'::user_role
    );
    
    -- For company_admin, create company first
    IF user_role = 'company_admin' THEN
      -- Get company info from user metadata
      SELECT 
        COALESCE((NEW.raw_user_meta_data->>'company_name'), 'New Company'),
        COALESCE((NEW.raw_user_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
      INTO company_name, subscription_type;
      
      -- Calculate trial end date (25 days from now)
      trial_end_date := now() + interval '25 days';
      
      -- Create the company
      INSERT INTO public.companies (
        name,
        subscription_type,
        trial_start_date,
        trial_end_date,
        created_by,
        is_active
      )
      VALUES (
        company_name,
        subscription_type,
        CASE 
          WHEN subscription_type = 'trial' THEN now() 
          ELSE NULL 
        END,
        CASE 
          WHEN subscription_type = 'trial' THEN trial_end_date 
          ELSE NULL 
        END,
        NEW.id,
        true
      )
      RETURNING id INTO new_company_id;
      
      user_company_id := new_company_id;
    ELSE
      -- For other roles, company_id should be provided or NULL
      user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    END IF;
  END IF;

  -- Insert the profile with the correct company_id
  INSERT INTO public.profiles (
    id,
    email,
    role,
    full_name,
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_company_id
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();