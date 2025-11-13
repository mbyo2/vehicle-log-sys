-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Notification type preferences
  maintenance_reminders BOOLEAN DEFAULT true,
  vehicle_issues BOOLEAN DEFAULT true,
  document_expiry BOOLEAN DEFAULT true,
  user_actions BOOLEAN DEFAULT true,
  approval_required BOOLEAN DEFAULT true,
  urgent_alerts BOOLEAN DEFAULT true,
  
  -- Delivery method preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  
  -- Frequency preferences
  digest_mode BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
  
  -- Contact info
  phone_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_company_id ON notification_preferences(company_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_company_id UUID,
  p_notification_type TEXT,
  p_delivery_method TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  prefs notification_preferences%ROWTYPE;
  check_time TIME;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs
  FROM notification_preferences
  WHERE user_id = p_user_id
  AND (company_id = p_company_id OR company_id IS NULL)
  LIMIT 1;
  
  -- If no preferences, allow all notifications
  IF prefs IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check delivery method enabled
  IF p_delivery_method = 'email' AND NOT prefs.email_enabled THEN
    RETURN FALSE;
  END IF;
  
  IF p_delivery_method = 'sms' AND NOT prefs.sms_enabled THEN
    RETURN FALSE;
  END IF;
  
  IF p_delivery_method = 'push' AND NOT prefs.push_enabled THEN
    RETURN FALSE;
  END IF;
  
  IF p_delivery_method = 'in_app' AND NOT prefs.in_app_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Check notification type enabled
  IF p_notification_type = 'maintenance' AND NOT prefs.maintenance_reminders THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'vehicle_issue' AND NOT prefs.vehicle_issues THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'document_expiry' AND NOT prefs.document_expiry THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'user_action' AND NOT prefs.user_actions THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'approval_required' AND NOT prefs.approval_required THEN
    RETURN FALSE;
  END IF;
  
  IF p_notification_type = 'urgent' AND NOT prefs.urgent_alerts THEN
    RETURN FALSE;
  END IF;
  
  -- Check quiet hours (skip for urgent notifications)
  IF prefs.quiet_hours_enabled AND p_notification_type != 'urgent' THEN
    check_time := LOCALTIME;
    
    IF prefs.quiet_hours_start < prefs.quiet_hours_end THEN
      -- Normal case: quiet hours within same day
      IF check_time >= prefs.quiet_hours_start AND check_time < prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    ELSE
      -- Quiet hours span midnight
      IF check_time >= prefs.quiet_hours_start OR check_time < prefs.quiet_hours_end THEN
        RETURN FALSE;
      END IF;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(p_user_id UUID, p_company_id UUID)
RETURNS notification_preferences AS $$
DECLARE
  prefs notification_preferences%ROWTYPE;
BEGIN
  SELECT * INTO prefs
  FROM notification_preferences
  WHERE user_id = p_user_id
  AND (company_id = p_company_id OR company_id IS NULL)
  LIMIT 1;
  
  -- If no preferences exist, return defaults
  IF prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id, company_id)
    VALUES (p_user_id, p_company_id)
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;