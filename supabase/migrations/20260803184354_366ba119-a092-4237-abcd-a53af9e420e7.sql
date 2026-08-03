DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.enforce_message_recipient_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Senders/admins are unaffected only insofar as this restricts recipient-only edits
  IF auth.uid() = OLD.recipient_id AND auth.uid() <> OLD.sender_id THEN
    IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
      OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
      OR NEW.company_id IS DISTINCT FROM OLD.company_id
      OR NEW.subject IS DISTINCT FROM OLD.subject
      OR NEW.content IS DISTINCT FROM OLD.content
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'Recipients may only update the read status of a message';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_message_recipient_update ON public.messages;
CREATE TRIGGER enforce_message_recipient_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_recipient_update();

REVOKE EXECUTE ON FUNCTION public.enforce_message_recipient_update() FROM PUBLIC, anon, authenticated;