-- First, clean up existing policies and then create comprehensive security solution

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view their company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 1. Create missing MFA tables with proper security
CREATE TABLE IF NOT EXISTS public.user_mfa_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  encrypted_secret TEXT NOT NULL,
  backup_codes TEXT[], -- Encrypted backup codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.two_factor_backup_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL, -- Hash of the backup code
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on MFA tables
ALTER TABLE public.user_mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

-- 2. Create secure policies for MFA tables
CREATE POLICY "mfa_secrets_user_access" 
ON public.user_mfa_secrets 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "backup_codes_user_access" 
ON public.two_factor_backup_codes 
FOR ALL 
USING (auth.uid() = user_id);

-- 3. Create restrictive profile policies
CREATE POLICY "profile_own_access" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profile_super_admin_access" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "profile_company_admin_access" 
ON public.profiles 
FOR SELECT 
USING (
  get_current_user_role() = 'company_admin'::user_role 
  AND company_id = get_current_company_id()
  AND company_id IS NOT NULL
);

CREATE POLICY "profile_own_update" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "profile_super_admin_manage" 
ON public.profiles 
FOR ALL 
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "profile_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Create session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_user_access" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Create enhanced security events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security_events_super_admin" 
ON public.security_events 
FOR SELECT 
USING (get_current_user_role() = 'super_admin'::user_role);

CREATE POLICY "security_events_company_admin" 
ON public.security_events 
FOR SELECT 
USING (
  get_current_user_role() = 'company_admin'::user_role 
  AND user_id IN (
    SELECT id FROM profiles 
    WHERE company_id = get_current_company_id()
  )
);

-- 6. Create workflow states table
CREATE TABLE IF NOT EXISTS public.workflow_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_state TEXT NOT NULL,
  assigned_to UUID,
  company_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_states_company_access" 
ON public.workflow_states 
FOR SELECT 
USING (company_id = get_current_company_id());

CREATE POLICY "workflow_states_admin_manage" 
ON public.workflow_states 
FOR ALL 
USING (
  company_id = get_current_company_id() 
  AND get_current_user_role() = ANY(ARRAY['super_admin'::user_role, 'company_admin'::user_role, 'supervisor'::user_role])
);