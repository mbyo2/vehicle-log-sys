-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role app_role NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Company admins can view their company invitations"
ON public.user_invitations FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'super_admin')
  )
);

CREATE POLICY "Company admins can create invitations"
ON public.user_invitations FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'super_admin')
  )
);

CREATE POLICY "Company admins can update their company invitations"
ON public.user_invitations FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'super_admin')
  )
);

CREATE POLICY "Public can view invitation by token"
ON public.user_invitations FOR SELECT TO anon
USING (
  status = 'pending' AND expires_at > now()
);

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

-- Trigger for updated_at
CREATE TRIGGER update_user_invitations_updated_at
BEFORE UPDATE ON public.user_invitations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();