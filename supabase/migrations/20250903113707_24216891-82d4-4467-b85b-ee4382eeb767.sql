-- Fix the remaining security warnings by adding search_path to functions that need it

-- Fix log_mfa_access function
CREATE OR REPLACE FUNCTION public.log_mfa_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'mfa_secret_access',
    auth.uid(),
    (SELECT company_id FROM profiles WHERE id = auth.uid()),
    jsonb_build_object(
      'action', TG_OP,
      'target_user', COALESCE(NEW.user_id, OLD.user_id),
      'timestamp', now()
    ),
    'high'
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix log_profile_access function  
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() != COALESCE(NEW.id, OLD.id) THEN
    INSERT INTO security_audit_logs (
      event_type, user_id, company_id, event_data, risk_level
    ) VALUES (
      'profile_data_access',
      auth.uid(),
      (SELECT company_id FROM profiles WHERE id = auth.uid()),
      jsonb_build_object(
        'action', TG_OP,
        'target_profile', COALESCE(NEW.id, OLD.id),
        'updated_data', CASE 
          WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)
          ELSE NULL
        END,
        'timestamp', now()
      ),
      'medium'
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;