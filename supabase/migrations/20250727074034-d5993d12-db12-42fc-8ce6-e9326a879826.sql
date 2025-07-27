-- Phase 1: Critical Database Security Fixes

-- Enable RLS on tables that lack it
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- Fix database functions with proper search_path protection
CREATE OR REPLACE FUNCTION public.update_vehicle_kilometers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    UPDATE vehicles
    SET current_kilometers = NEW.end_kilometers,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_user_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.user_activity_logs (user_id, company_id, action, details)
    VALUES (
        auth.uid(),
        NEW.company_id,
        TG_OP,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'record_id', NEW.id,
            'changes', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vehicle_kilometers_after_trip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.end_kilometers IS NOT NULL THEN
        UPDATE vehicles
        SET current_kilometers = NEW.end_kilometers
        WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_super_admin_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.role = 'super_admin' AND 
    (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') > 0 THEN
    RAISE EXCEPTION 'Only one super admin is allowed';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.check_if_first_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_ip_whitelist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    user_company_id uuid;
    ip_is_whitelisted boolean;
BEGIN
    -- Get user's company_id
    SELECT company_id INTO user_company_id
    FROM profiles
    WHERE id = auth.uid();

    -- Check if IP exists in whitelist for the company
    SELECT EXISTS (
        SELECT 1
        FROM ip_whitelist
        WHERE company_id = user_company_id
        AND ip_address = current_setting('request.headers')::json->>'cf-connecting-ip'
    ) INTO ip_is_whitelisted;

    -- If company has IP whitelist entries but current IP is not whitelisted
    IF NOT ip_is_whitelisted AND EXISTS (
        SELECT 1 FROM ip_whitelist WHERE company_id = user_company_id
    ) THEN
        RAISE EXCEPTION 'Access denied: IP address not whitelisted';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_document_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.verification_status != OLD.verification_status THEN
        INSERT INTO audit_logs (
            table_name,
            record_id,
            action,
            performed_by,
            company_id,
            new_data
        ) VALUES (
            'documents',
            NEW.id,
            'document_verification',
            NEW.verified_by,
            NEW.company_id,
            jsonb_build_object(
                'status', NEW.verification_status,
                'notes', NEW.verification_notes,
                'verified_at', NEW.verified_at
            )
        );
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_user_id uuid DEFAULT NULL::uuid, p_company_id uuid DEFAULT NULL::uuid, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_event_data jsonb DEFAULT '{}'::jsonb, p_risk_level text DEFAULT 'low'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, ip_address, 
    user_agent, event_data, risk_level
  )
  VALUES (
    p_event_type, p_user_id, p_company_id, p_ip_address,
    p_user_agent, p_event_data, p_risk_level
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_first_user boolean;
  user_role user_role;
  user_company_id uuid;
BEGIN
  -- Check if this is the first user by counting existing profiles
  SELECT COUNT(*) = 0 INTO is_first_user FROM profiles;
  
  -- Determine role
  IF is_first_user THEN
    user_role := 'super_admin'::user_role;
    user_company_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_app_meta_data->>'role')::user_role,
      'company_admin'::user_role
    );
    user_company_id := (NEW.raw_app_meta_data->>'company_id')::uuid;
  END IF;

  -- Insert the profile
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
$function$;

CREATE OR REPLACE FUNCTION public.log_error(p_error_type text, p_error_message text, p_stack_trace text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid, p_company_id uuid DEFAULT NULL::uuid, p_url text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text, p_error_data jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type, error_message, stack_trace, user_id,
    company_id, url, user_agent, error_data
  )
  VALUES (
    p_error_type, p_error_message, p_stack_trace, p_user_id,
    p_company_id, p_url, p_user_agent, p_error_data
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_backup(p_company_id uuid, p_backup_type text DEFAULT 'scheduled'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  backup_id UUID;
BEGIN
  INSERT INTO backup_logs (
    company_id, backup_type, status, started_at
  )
  VALUES (
    p_company_id, p_backup_type, 'in_progress', now()
  )
  RETURNING id INTO backup_id;
  
  -- Here you would trigger the actual backup process
  UPDATE backup_logs 
  SET status = 'completed', completed_at = now()
  WHERE id = backup_id;
  
  RETURN backup_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_company_for_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_company_id uuid;
  trial_end_date timestamp with time zone;
  company_name text;
  subscription_type subscription_type;
BEGIN
  -- Only create company for company_admin role
  IF NEW.role = 'company_admin' THEN
    -- Get company info from user metadata
    SELECT 
      COALESCE((u.raw_app_meta_data->>'company_name'), 'New Company'),
      COALESCE((u.raw_app_meta_data->>'subscription_type')::subscription_type, 'trial'::subscription_type)
    INTO company_name, subscription_type
    FROM auth.users u 
    WHERE u.id = NEW.id;
    
    -- Calculate trial end date (25 days from now)
    trial_end_date := now() + interval '25 days';
    
    -- Create the company
    INSERT INTO public.companies (
      name,
      subscription_type,
      trial_start_date,
      trial_end_date,
      created_by,
      is_active
    )
    VALUES (
      company_name,
      subscription_type,
      CASE 
        WHEN subscription_type = 'trial' THEN now() 
        ELSE NULL 
      END,
      CASE 
        WHEN subscription_type = 'trial' THEN trial_end_date 
        ELSE NULL 
      END,
      NEW.id,
      true
    )
    RETURNING id INTO new_company_id;
    
    -- Update the profile's company_id
    UPDATE profiles 
    SET company_id = new_company_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.process_service_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Invoke the edge function to send reminders
    PERFORM 
        net.http_post(
            url:='https://yyeypbfdtitxqssvnagy.supabase.co/functions/v1/send-booking-reminders',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
        );
END;
$function$;