-- Create notification digest queue for batched notifications
CREATE TABLE public.notification_digest_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  delivery_method TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_digest_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all digest entries
CREATE POLICY "Service role manages digest queue"
  ON public.notification_digest_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for efficient processing
CREATE INDEX idx_notification_digest_user ON public.notification_digest_queue(user_id, delivery_method);
CREATE INDEX idx_notification_digest_created ON public.notification_digest_queue(created_at);