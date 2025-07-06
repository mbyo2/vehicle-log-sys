
-- Create the user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'supervisor', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the subscription_type enum if it doesn't exist  
DO $$ BEGIN
    CREATE TYPE subscription_type AS ENUM ('trial', 'full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role user_role NOT NULL,
    full_name text,
    company_id uuid,
    two_factor_enabled boolean DEFAULT false,
    two_factor_method text DEFAULT 'email',
    two_factor_secret text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create the companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subscription_type subscription_type NOT NULL DEFAULT 'trial'::subscription_type,
    trial_start_date timestamp with time zone,
    trial_end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by uuid,
    logo_url text,
    branding_primary_color text,
    branding_secondary_color text
);

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow super admins to view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role')::text = 'super_admin'
    )
  );

-- Allow company admins to view profiles in their company
DROP POLICY IF EXISTS "Company admins can view company profiles" ON profiles;
CREATE POLICY "Company admins can view company profiles" ON profiles
  FOR SELECT USING (
    company_id IN (
      SELECT p.company_id FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('company_admin', 'super_admin')
    )
    OR auth.uid() = id
  );

-- Create RLS policies for companies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company admins can update their own company" ON companies;
CREATE POLICY "Company admins can update their own company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('company_admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
CREATE POLICY "Super admins can view all companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create the handle_new_user function that creates profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_first_user boolean;
  user_role user_role;
  user_company_id uuid;
BEGIN
  -- Check if this is the first user
  SELECT NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) INTO is_first_user;
  
  -- Determine role
  IF is_first_user THEN
    user_role := 'super_admin'::user_role;
    user_company_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_app_meta_data->>'role')::user_role,
      'driver'::user_role
    );
    user_company_id := (NEW.raw_app_meta_data->>'company_id')::uuid;
  END IF;

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

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to handle company creation for company admins
CREATE OR REPLACE FUNCTION public.create_company_for_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  trial_end_date timestamp with time zone;
BEGIN
  -- Only create company for company_admin role
  IF NEW.role = 'company_admin' THEN
    -- Get company info from user metadata
    SELECT 
      (u.raw_app_meta_data->>'company_name')::text,
      COALESCE((u.raw_app_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
    FROM auth.users u 
    WHERE u.id = NEW.id
    INTO trial_end_date; -- reusing variable for company name temporarily
    
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
      COALESCE((SELECT raw_app_meta_data->>'company_name' FROM auth.users WHERE id = NEW.id), 'New Company'),
      COALESCE((SELECT (raw_app_meta_data->>'subscription_type')::subscription_type FROM auth.users WHERE id = NEW.id), 'trial'::subscription_type),
      CASE 
        WHEN COALESCE((SELECT raw_app_meta_data->>'subscription_type' FROM auth.users WHERE id = NEW.id), 'trial') = 'trial' 
        THEN now() 
        ELSE NULL 
      END,
      CASE 
        WHEN COALESCE((SELECT raw_app_meta_data->>'subscription_type' FROM auth.users WHERE id = NEW.id), 'trial') = 'trial' 
        THEN trial_end_date 
        ELSE NULL 
      END,
      NEW.id,
      true
    )
    RETURNING id INTO new_company_id;
    
    -- Update the profile's company_id
    UPDATE profiles 
    SET company_id = new_company_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for company creation
DROP TRIGGER IF EXISTS on_company_admin_created ON public.profiles;
CREATE TRIGGER on_company_admin_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  WHEN (NEW.role = 'company_admin')
  EXECUTE PROCEDURE public.create_company_for_admin();

-- Create function to check if this is the first user
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
