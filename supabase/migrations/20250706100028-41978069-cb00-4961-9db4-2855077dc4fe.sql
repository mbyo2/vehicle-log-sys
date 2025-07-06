-- Fix the recursive RLS policies that are causing infinite recursion
-- Drop all existing problematic policies first
DROP POLICY IF EXISTS "Allow system functions to access profiles" ON profiles;
DROP POLICY IF EXISTS "Company admins can create and update profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Company admins can read company profiles" ON profiles;
DROP POLICY IF EXISTS "Company admins can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Company admins can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by users in same company or super_admin" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Super admin can do everything" ON profiles;
DROP POLICY IF EXISTS "Super admins can do everything with profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Allow super admins to view all profiles (using the function to avoid recursion)
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (
    COALESCE(public.get_user_role(), 'driver') = 'super_admin'
  );

-- Allow super admins to manage all profiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
  FOR ALL USING (
    COALESCE(public.get_user_role(), 'driver') = 'super_admin'
  );

-- Allow company admins to view profiles in their company
CREATE POLICY "Company admins can view company profiles" ON profiles
  FOR SELECT USING (
    COALESCE(public.get_user_role(), 'driver') IN ('company_admin', 'supervisor') 
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Clean up company policies as well and make them simpler
DROP POLICY IF EXISTS "Companies are viewable by super admins" ON companies;
DROP POLICY IF EXISTS "Companies branding updatable by company admin" ON companies;
DROP POLICY IF EXISTS "Companies can be created by super admins" ON companies;
DROP POLICY IF EXISTS "Companies can be updated by super admins" ON companies;
DROP POLICY IF EXISTS "Companies insertable by super_admin" ON companies;
DROP POLICY IF EXISTS "Companies updatable by company admin" ON companies;
DROP POLICY IF EXISTS "Companies viewable by authenticated users" ON companies;
DROP POLICY IF EXISTS "Company admins can update their own company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their own company settings" ON companies;
DROP POLICY IF EXISTS "Company admins can view and update their own company" ON companies;
DROP POLICY IF EXISTS "Super admins can do everything with companies" ON companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- Create simple company policies
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can manage all companies" ON companies
  FOR ALL USING (
    COALESCE(public.get_user_role(), 'driver') = 'super_admin'
  );

CREATE POLICY "Company admins can update their company" ON companies
  FOR UPDATE USING (
    id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND COALESCE(public.get_user_role(), 'driver') = 'company_admin'
  );

CREATE POLICY "Super admins can create companies" ON companies
  FOR INSERT WITH CHECK (
    COALESCE(public.get_user_role(), 'driver') = 'super_admin'
  );

-- Update the handle_new_user function to be more robust
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
  -- Check if this is the first user by counting existing profiles
  SELECT COUNT(*) = 0 INTO is_first_user FROM profiles;
  
  -- Determine role
  IF is_first_user THEN
    user_role := 'super_admin'::user_role;
    user_company_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_app_meta_data->>'role')::user_role,
      'company_admin'::user_role  -- Default to company_admin instead of driver
    );
    user_company_id := (NEW.raw_app_meta_data->>'company_id')::uuid;
  END IF;

  -- Insert the profile
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

-- Fix the company creation function
CREATE OR REPLACE FUNCTION public.create_company_for_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  trial_end_date timestamp with time zone;
  company_name text;
  subscription_type subscription_type;
BEGIN
  -- Only create company for company_admin role
  IF NEW.role = 'company_admin' THEN
    -- Get company info from user metadata
    SELECT 
      COALESCE((u.raw_app_meta_data->>'company_name'), 'New Company'),
      COALESCE((u.raw_app_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
    INTO company_name, subscription_type
    FROM auth.users u 
    WHERE u.id = NEW.id;
    
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
    
    -- Update the profile's company_id
    UPDATE profiles 
    SET company_id = new_company_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;