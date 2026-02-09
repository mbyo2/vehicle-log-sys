-- Remove the old super_admin assignment so bootstrap can run again
DELETE FROM public.user_roles WHERE user_id = '4f07d604-42db-434e-8b2e-bea7da62b874' AND role::text = 'super_admin';