
-- Drop and recreate the handle_new_user function to fix the role field issue
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user boolean;
  user_role app_role;
  user_company_id uuid;
  new_company_id uuid;
  company_name text;
  subscription_type subscription_type;
  trial_end_date timestamp with time zone;
BEGIN
  -- Check if this is the first user (no existing user_roles)
  SELECT COUNT(*) = 0 INTO is_first_user FROM user_roles;
  
  IF is_first_user THEN
    -- First user automatically becomes super admin
    user_role := 'super_admin'::app_role;
    user_company_id := NULL;
    
    -- Log this important event
    INSERT INTO security_events (
      user_id,
      event_type,
      event_details,
      risk_score
    ) VALUES (
      NEW.id,
      'super_admin_created',
      jsonb_build_object(
        'email', NEW.email,
        'created_at', now(),
        'is_first_user', true
      ),
      0
    );
  ELSE
    -- For subsequent users, check metadata or default to company_admin
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'company_admin'::app_role
    );
    
    -- If this is a company_admin, create a company for them
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
      -- For other roles, get company_id from metadata
      user_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    END IF;
  END IF;

  -- Create the profile (without role)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_company_id
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (
    user_id,
    role,
    company_id
  )
  VALUES (
    NEW.id,
    user_role,
    user_company_id
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
