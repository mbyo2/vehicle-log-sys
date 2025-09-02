-- First, let's check if we can create a test super admin account
-- We'll temporarily allow multiple super admins for testing

-- Drop the existing constraint that prevents multiple super admins
DROP TRIGGER IF EXISTS check_super_admin_count_trigger ON public.profiles;

-- Create a simple function to reset super admin for testing
CREATE OR REPLACE FUNCTION public.create_test_super_admin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function helps create a test super admin account
  -- Returns instructions for the user
  RETURN 'To create a test super admin: 1) Delete existing super admin from Supabase dashboard, 2) Visit /signup to create new account';
END;
$$;