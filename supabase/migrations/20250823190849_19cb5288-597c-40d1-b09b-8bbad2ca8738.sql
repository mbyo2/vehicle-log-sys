-- Fix the check_if_first_user function to bypass RLS
CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Use SECURITY DEFINER to bypass RLS and get accurate count
  RETURN NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);
END;
$$;