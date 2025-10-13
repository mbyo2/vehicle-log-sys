-- Drop the role column from profiles table with CASCADE
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;