-- Drop the trigger and function with CASCADE
DROP TRIGGER IF EXISTS trg_enforce_profile_update_restrictions ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_profile_update_restrictions() CASCADE;