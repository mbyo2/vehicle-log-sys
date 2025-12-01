CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('maintenance', 'vehicle_issue', 'document_expiry', 'user_action', 'approval_required', 'urgent')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'in_app', 'push')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  html_template TEXT,
  styling_config JSONB DEFAULT '{}',
  variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, template_name, notification_type, delivery_method)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;