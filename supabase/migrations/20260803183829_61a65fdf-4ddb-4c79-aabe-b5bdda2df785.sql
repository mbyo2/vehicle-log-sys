-- 1. messages: cross-tenant insert hardening
DROP POLICY IF EXISTS "Users can insert messages they send" ON public.messages;
CREATE POLICY "Users can insert messages they send"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND company_id = public.get_current_company_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = recipient_id
      AND p.company_id = public.get_current_company_id()
  )
);

-- 2. driver_trainings: support both auth user id and drivers.id scoping
DROP POLICY IF EXISTS "Drivers can view their own trainings" ON public.driver_trainings;
CREATE POLICY "Drivers can view their own trainings"
ON public.driver_trainings
FOR SELECT
TO authenticated
USING (
  driver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = driver_trainings.driver_id
      AND d.profile_id = auth.uid()
  )
);

-- 3. security_events: use has_role directly instead of role-resolution helper
DROP POLICY IF EXISTS "security_events_company_admin" ON public.security_events;
DROP POLICY IF EXISTS "security_events_super_admin" ON public.security_events;

CREATE POLICY "security_events_company_admin"
ON public.security_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role)
  AND user_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.company_id = public.get_current_company_id()
  )
);

CREATE POLICY "security_events_super_admin"
ON public.security_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));