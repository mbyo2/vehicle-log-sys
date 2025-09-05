-- Fix the super admin creation system to ensure first user becomes super admin

-- First, ensure the trigger exists and works properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function with better logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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
  -- Check if this is the first user (no existing profiles)
  SELECT COUNT(*) = 0 INTO is_first_user FROM profiles;
  
  IF is_first_user THEN
    -- First user automatically becomes super admin
    user_role := 'super_admin'::user_role;
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
      (NEW.raw_user_meta_data->>'role')::user_role,
      'company_admin'::user_role
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

  -- Create the profile
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

-- Create a helper function to check if someone is the first user
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE role = 'super_admin'::user_role 
    LIMIT 1
  );
END;
$$;

-- If there's an orphaned auth user, let's create their profile as super admin
DO $$
DECLARE
  orphaned_user record;
BEGIN
  -- Find auth users without profiles
  FOR orphaned_user IN 
    SELECT u.id, u.email, u.created_at
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    ORDER BY u.created_at ASC
  LOOP
    -- Create profile for the orphaned user
    -- First user gets super_admin, others get company_admin
    INSERT INTO public.profiles (
      id,
      email,
      role,
      full_name,
      company_id
    )
    VALUES (
      orphaned_user.id,
      orphaned_user.email,
      CASE 
        WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'super_admin') 
        THEN 'super_admin'::user_role
        ELSE 'company_admin'::user_role
      END,
      '',
      NULL
    );
    
    -- Log this event
    INSERT INTO security_events (
      user_id,
      event_type,
      event_details,
      risk_score
    ) VALUES (
      orphaned_user.id,
      'profile_created_for_orphaned_user',
      jsonb_build_object(
        'email', orphaned_user.email,
        'was_first_user', NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'super_admin' AND id != orphaned_user.id)
      ),
      10
    );
  END LOOP;
END $$;