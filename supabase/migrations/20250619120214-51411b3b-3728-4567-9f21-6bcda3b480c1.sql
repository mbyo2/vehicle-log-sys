
-- First, drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Company admins can view company profiles" ON profiles;

-- Create a security definer function to get current user role without causing recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
  -- Use a direct query to auth.users metadata to avoid recursion
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'role')::user_role,
      CASE 
        WHEN NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN 'super_admin'::user_role
        ELSE 'driver'::user_role
      END
    )
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a function to check if first user (without referencing profiles table in policy)
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies that don't cause recursion
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow super admins to view all profiles (using metadata, not profiles table)
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_app_meta_data->>'role')::text = 'super_admin'
    )
  );

-- Allow company admins to view profiles in their company
CREATE POLICY "Company admins can view company profiles" ON profiles
  FOR SELECT USING (
    company_id IN (
      SELECT p.company_id FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('company_admin', 'super_admin')
    )
    OR auth.uid() = id  -- Always allow viewing own profile
  );

-- Update the handle_new_user function to handle first user properly
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
