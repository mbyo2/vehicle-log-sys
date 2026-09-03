CREATE OR REPLACE FUNCTION public.check_vehicle_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- No authenticated user (internal/system operation): skip user rate limiting.
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NOT check_rate_limit(
    auth.uid()::text || '_vehicle_ops',
    TG_OP,
    60,
    5
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded for vehicle operations';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;