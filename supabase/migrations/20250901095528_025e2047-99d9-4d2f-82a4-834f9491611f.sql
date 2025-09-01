-- Create user_mfa_secrets table for storing two-factor authentication secrets
CREATE TABLE IF NOT EXISTS public.user_mfa_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_mfa_secrets ENABLE ROW LEVEL SECURITY;

-- Create policies for MFA secrets
CREATE POLICY "Users can view their own MFA secrets"
ON public.user_mfa_secrets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own MFA secrets"
ON public.user_mfa_secrets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own MFA secrets"
ON public.user_mfa_secrets
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own MFA secrets"
ON public.user_mfa_secrets
FOR DELETE
USING (user_id = auth.uid());

-- Add two_factor_enabled column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create trigger for updating timestamps
CREATE OR REPLACE TRIGGER update_user_mfa_secrets_updated_at
BEFORE UPDATE ON public.user_mfa_secrets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();