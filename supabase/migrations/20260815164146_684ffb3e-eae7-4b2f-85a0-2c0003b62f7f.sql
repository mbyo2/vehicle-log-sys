CREATE OR REPLACE FUNCTION public.log_vehicle_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record_id uuid;
  v_company_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
  ELSE
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
  END IF;

  INSERT INTO public.security_audit_logs (
    event_type, user_id, company_id, event_data, risk_level
  ) VALUES (
    'vehicle_data_modification',
    auth.uid(),
    COALESCE(v_company_id, (SELECT company_id FROM public.profiles WHERE id = auth.uid())),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'vehicle_id', v_record_id,
      'timestamp', now()
    ),
    'medium'
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_vehicle_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT check_rate_limit(
    auth.uid()::text || '_vehicle_ops',
    TG_OP,
    60, -- 60 operations
    5   -- per 5 minutes
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for vehicle operations';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;