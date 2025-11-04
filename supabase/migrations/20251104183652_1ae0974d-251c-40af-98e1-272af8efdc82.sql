-- Fix security issue: Remove SECURITY DEFINER view
DROP VIEW IF EXISTS public.user_company_memberships;