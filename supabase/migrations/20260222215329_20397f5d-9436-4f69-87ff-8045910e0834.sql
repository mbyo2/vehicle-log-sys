
-- Allow authenticated users to INSERT security event logs
CREATE POLICY "Authenticated users can insert security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to SELECT their own security events
CREATE POLICY "Users can view their own security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
