-- Fix the check_if_first_user function to properly detect existing super admin accounts
DROP FUNCTION IF EXISTS public.check_if_first_user();

CREATE OR REPLACE FUNCTION public.check_if_first_user()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if any super admin profiles exist
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE role = 'super_admin'::user_role 
    LIMIT 1
  );
END;
$function$;