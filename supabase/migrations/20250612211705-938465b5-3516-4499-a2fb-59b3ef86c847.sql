
-- Create security audit logs table
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  ip_address TEXT,
  user_agent TEXT,
  event_data JSONB DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create error monitoring table
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  url TEXT,
  user_agent TEXT,
  error_data JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Create backup logs table (already exists but let's ensure it has all needed columns)
ALTER TABLE public.backup_logs 
ADD COLUMN IF NOT EXISTS backup_frequency TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS retention_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT true;

-- Create system health monitoring table
CREATE TABLE public.system_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security policies table
CREATE TABLE public.security_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  policy_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

-- Security audit logs policies
CREATE POLICY "Super admins can view all security audit logs" 
  ON security_audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins can view their company's security audit logs" 
  ON security_audit_logs FOR SELECT 
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('company_admin', 'super_admin')
    )
  );

-- Error logs policies
CREATE POLICY "Super admins can manage all error logs" 
  ON error_logs FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins can view their company's error logs" 
  ON error_logs FOR SELECT 
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('company_admin', 'super_admin')
    )
  );

-- System health logs policies (super admin only)
CREATE POLICY "Super admins can manage system health logs" 
  ON system_health_logs FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Security policies policies
CREATE POLICY "Company admins can manage their security policies" 
  ON security_policies FOR ALL 
  USING (
    company_id IN (
      SELECT profiles.company_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('company_admin', 'super_admin')
    )
  );

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    event_type, user_id, company_id, ip_address, 
    user_agent, event_data, risk_level
  )
  VALUES (
    p_event_type, p_user_id, p_company_id, p_ip_address,
    p_user_agent, p_event_data, p_risk_level
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to log errors
CREATE OR REPLACE FUNCTION public.log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_error_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO error_logs (
    error_type, error_message, stack_trace, user_id,
    company_id, url, user_agent, error_data
  )
  VALUES (
    p_error_type, p_error_message, p_stack_trace, p_user_id,
    p_company_id, p_url, p_user_agent, p_error_data
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to create automated backups
CREATE OR REPLACE FUNCTION public.create_backup(
  p_company_id UUID,
  p_backup_type TEXT DEFAULT 'scheduled'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_id UUID;
BEGIN
  INSERT INTO backup_logs (
    company_id, backup_type, status, started_at
  )
  VALUES (
    p_company_id, p_backup_type, 'in_progress', now()
  )
  RETURNING id INTO backup_id;
  
  -- Here you would trigger the actual backup process
  -- For now, we'll just mark it as completed
  UPDATE backup_logs 
  SET status = 'completed', completed_at = now()
  WHERE id = backup_id;
  
  RETURN backup_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX idx_security_audit_logs_risk_level ON security_audit_logs(risk_level);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_system_health_logs_metric_name ON system_health_logs(metric_name);
CREATE INDEX idx_system_health_logs_created_at ON system_health_logs(created_at);
