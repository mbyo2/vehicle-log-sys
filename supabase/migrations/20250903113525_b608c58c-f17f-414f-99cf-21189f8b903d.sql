-- Clear all user data to start fresh
-- Delete all profiles first (due to foreign key constraints)
DELETE FROM public.profiles;

-- Clear any user-related data
DELETE FROM public.user_mfa_secrets;
DELETE FROM public.security_audit_logs;
DELETE FROM public.error_logs;
DELETE FROM public.auth_rate_limits;

-- Note: We cannot directly delete from auth.users table via SQL
-- The user needs to delete users from the Supabase dashboard

-- Reset any sequences or counters if needed
-- This ensures a completely fresh start