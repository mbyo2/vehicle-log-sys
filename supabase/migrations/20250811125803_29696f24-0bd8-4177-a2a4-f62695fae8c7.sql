-- Phase 4 & 5: Additional Security Infrastructure

-- Create security audit results table
CREATE TABLE IF NOT EXISTS public.security_audit_results (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id uuid NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    results jsonb NOT NULL DEFAULT '[]'::jsonb,
    score integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    error_message text,
    company_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security audit results
ALTER TABLE public.security_audit_results ENABLE ROW LEVEL SECURITY;

-- Create policies for security audit results
CREATE POLICY "Super admins can manage all security audit results"
ON public.security_audit_results
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Company admins can view their company's audit results"
ON public.security_audit_results
FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid() AND role = 'company_admin'
    )
);

-- Enhance backup logs with encryption and retention fields
ALTER TABLE public.backup_logs 
ADD COLUMN IF NOT EXISTS backup_hash text,
ADD COLUMN IF NOT EXISTS encryption_key_id text,
ADD COLUMN IF NOT EXISTS compression_ratio numeric,
ADD COLUMN IF NOT EXISTS backup_location text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending';

-- Create table for security policies configuration
CREATE TABLE IF NOT EXISTS public.security_policy_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL,
    policy_name text NOT NULL,
    policy_type text NOT NULL,
    is_enabled boolean NOT NULL DEFAULT true,
    configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid NOT NULL
);

-- Enable RLS on security policy config
ALTER TABLE public.security_policy_config ENABLE ROW LEVEL SECURITY;

-- Create policies for security policy config
CREATE POLICY "Company admins can manage their security policies"
ON public.security_policy_config
FOR ALL
USING (
    company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid() AND role IN ('company_admin', 'super_admin')
    )
);

-- Create function to verify backup integrity
CREATE OR REPLACE FUNCTION public.verify_backup_integrity(backup_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    backup_record record;
    verification_result boolean;
BEGIN
    -- Get backup record
    SELECT * INTO backup_record
    FROM backup_logs
    WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup not found';
    END IF;
    
    -- Simulate backup verification (in real implementation, this would verify file integrity)
    verification_result := (backup_record.status = 'completed' AND backup_record.file_path IS NOT NULL);
    
    -- Update verification status
    UPDATE backup_logs
    SET verification_status = CASE 
        WHEN verification_result THEN 'verified'
        ELSE 'failed'
    END
    WHERE id = backup_id;
    
    RETURN verification_result;
END;
$function$;

-- Create function to check table RLS status (for security audits)
CREATE OR REPLACE FUNCTION public.check_table_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::text as table_name,
        c.relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
    ORDER BY c.relname;
END;
$function$;

-- Create function to check public table access
CREATE OR REPLACE FUNCTION public.check_public_table_access()
RETURNS TABLE(table_name text, has_public_access boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::text as table_name,
        (c.relrowsecurity = false OR 
         EXISTS (
             SELECT 1 FROM pg_policies p 
             WHERE p.tablename = c.relname 
             AND p.qual = 'true'
         )) as has_public_access
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    ORDER BY c.relname;
END;
$function$;

-- Create automated backup trigger
CREATE OR REPLACE FUNCTION public.schedule_automated_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    company_record record;
BEGIN
    -- Schedule backups for all active companies
    FOR company_record IN 
        SELECT id FROM companies WHERE is_active = true
    LOOP
        INSERT INTO backup_logs (
            company_id,
            backup_type,
            status,
            started_at,
            backup_location,
            encryption_enabled
        ) VALUES (
            company_record.id,
            'automated',
            'scheduled',
            now(),
            'secure_storage',
            true
        );
    END LOOP;
END;
$function$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_audit_results_company_id ON public.security_audit_results(company_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_results_started_at ON public.security_audit_results(started_at);
CREATE INDEX IF NOT EXISTS idx_backup_logs_verification_status ON public.backup_logs(verification_status);
CREATE INDEX IF NOT EXISTS idx_security_policy_config_company_id ON public.security_policy_config(company_id);

-- Insert default security policies for existing companies
INSERT INTO public.security_policy_config (company_id, policy_name, policy_type, configuration, created_by)
SELECT 
    c.id,
    'password_policy',
    'authentication',
    '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true}'::jsonb,
    c.created_by
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM security_policy_config spc 
    WHERE spc.company_id = c.id AND spc.policy_name = 'password_policy'
);

INSERT INTO public.security_policy_config (company_id, policy_name, policy_type, configuration, created_by)
SELECT 
    c.id,
    'session_timeout',
    'authentication',
    '{"timeout_minutes": 30, "extend_on_activity": true}'::jsonb,
    c.created_by
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM security_policy_config spc 
    WHERE spc.company_id = c.id AND spc.policy_name = 'session_timeout'
);

INSERT INTO public.security_policy_config (company_id, policy_name, policy_type, configuration, created_by)
SELECT 
    c.id,
    'backup_retention',
    'data_protection',
    '{"retention_days": 90, "encryption_enabled": true, "compression_enabled": true}'::jsonb,
    c.created_by
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM security_policy_config spc 
    WHERE spc.company_id = c.id AND spc.policy_name = 'backup_retention'
);