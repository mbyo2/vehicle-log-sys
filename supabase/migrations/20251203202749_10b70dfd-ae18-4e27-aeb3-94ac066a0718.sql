-- Enable RLS on notification_templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates for their company or default templates
CREATE POLICY "notification_templates_select" ON public.notification_templates
FOR SELECT TO authenticated
USING (
  company_id IS NULL 
  OR company_id = get_current_company_id()
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Policy: Company admins and super admins can insert templates
CREATE POLICY "notification_templates_insert" ON public.notification_templates
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- Policy: Company admins and super admins can update templates
CREATE POLICY "notification_templates_update" ON public.notification_templates
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- Policy: Company admins and super admins can delete templates
CREATE POLICY "notification_templates_delete" ON public.notification_templates
FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR (has_role(auth.uid(), 'company_admin'::app_role) AND company_id = get_current_company_id())
);

-- Insert default notification templates
INSERT INTO public.notification_templates (template_name, notification_type, delivery_method, subject_template, body_template, is_default, is_active) VALUES
('Maintenance Reminder', 'maintenance', 'email', 'Vehicle Maintenance Due: {{vehicle_name}}', 'Your vehicle {{vehicle_name}} is due for {{service_type}} maintenance on {{scheduled_date}}.', true, true),
('Document Expiry Alert', 'document_expiry', 'email', 'Document Expiring: {{document_name}}', 'The document {{document_name}} for {{entity_name}} will expire on {{expiry_date}}. Please renew it before expiration.', true, true),
('Trip Approval Required', 'approval_required', 'email', 'Trip Approval Needed', 'A new trip by {{driver_name}} requires your approval. Trip purpose: {{purpose}}.', true, true),
('Vehicle Issue Alert', 'vehicle_issue', 'email', 'Vehicle Issue Reported: {{vehicle_name}}', 'An issue has been reported for vehicle {{vehicle_name}}: {{issue_description}}.', true, true),
('Urgent Alert', 'urgent', 'email', 'URGENT: {{alert_title}}', '{{alert_message}}', true, true);