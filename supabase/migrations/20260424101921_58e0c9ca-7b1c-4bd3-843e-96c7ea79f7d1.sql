-- Tighten remaining always-true INSERT policies flagged by the linter

-- 1) notifications: only allow self-targeted inserts from authenticated users.
-- Edge functions/triggers continue to use service_role which bypasses RLS.
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

CREATE POLICY "notifications_insert_self"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) security_events: authenticated users can only log events tied to their own user_id
DROP POLICY IF EXISTS "Authenticated users can insert security events" ON public.security_events;

CREATE POLICY "security_events_insert_self"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);