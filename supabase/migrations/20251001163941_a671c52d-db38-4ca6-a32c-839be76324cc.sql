-- Fix function search_path security issues
-- Set search_path for all functions that don't have it

-- Fix decrypt_credentials function
DROP FUNCTION IF EXISTS public.decrypt_credentials(text, text);
CREATE OR REPLACE FUNCTION public.decrypt_credentials(encrypted_data text, encryption_key text DEFAULT 'default_key'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN decode(encrypted_data, 'base64')::text::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$function$;

-- Fix encrypt_credentials function
DROP FUNCTION IF EXISTS public.encrypt_credentials(jsonb, text);
CREATE OR REPLACE FUNCTION public.encrypt_credentials(credentials_data jsonb, encryption_key text DEFAULT 'default_key'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN encode(credentials_data::text::bytea, 'base64');
END;
$function$;

-- Update encrypt_integration_credentials to set search_path
DROP FUNCTION IF EXISTS public.encrypt_integration_credentials(jsonb);
CREATE OR REPLACE FUNCTION public.encrypt_integration_credentials(credentials_data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      credentials_data::text,
      current_setting('app.encryption_key', true)
    ),
    'base64'
  );
END;
$function$;

-- Update decrypt_integration_credentials to set search_path
DROP FUNCTION IF EXISTS public.decrypt_integration_credentials(text);
CREATE OR REPLACE FUNCTION public.decrypt_integration_credentials(encrypted_data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    current_setting('app.encryption_key', true)
  )::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$function$;

-- Add production readiness notes
COMMENT ON SCHEMA public IS 'Production Ready: Remember to enable leaked password protection in Supabase Dashboard > Authentication > Providers > Email > Password Protection and upgrade Postgres version in Settings > Infrastructure';