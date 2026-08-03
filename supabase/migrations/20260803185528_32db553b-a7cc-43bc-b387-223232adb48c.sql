CREATE OR REPLACE FUNCTION public.create_backup(p_company_id uuid, p_backup_type text DEFAULT 'scheduled'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  backup_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'Company is required';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'company_admin')
      AND p_company_id = public.get_current_company_id()
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_backup_type NOT IN ('manual', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid backup type';
  END IF;

  INSERT INTO backup_logs (company_id, backup_type, status, started_at)
  VALUES (p_company_id, p_backup_type, 'in_progress', now())
  RETURNING id INTO backup_id;

  UPDATE backup_logs
  SET status = 'completed', completed_at = now()
  WHERE id = backup_id;

  RETURN backup_id;
END;
$function$;

DROP POLICY IF EXISTS "Drivers can view their own trainings" ON public.driver_trainings;
CREATE POLICY "Drivers can view their own trainings"
ON public.driver_trainings
FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid()
  AND company_id = public.get_current_company_id()
);

DROP POLICY IF EXISTS "Users can update messages they received (to mark as read)" ON public.messages;