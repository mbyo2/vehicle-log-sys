# Comprehensive Notification System

## Overview

The notification system provides multi-channel alerts with user preferences management, supporting real-time push notifications, email alerts, SMS messaging, and in-app notifications.

## Features

### 1. Notification Types
- **Maintenance Reminders**: Scheduled maintenance and service alerts
- **Vehicle Issues**: Vehicle problems and repair notifications
- **Document Expiry**: Expiring licenses, insurance, and documents
- **User Actions**: Team member activities and updates
- **Approval Required**: Items pending user approval
- **Urgent Alerts**: Critical notifications (bypasses quiet hours)

### 2. Delivery Methods
- **In-App Notifications**: Real-time notifications within the application
- **Email Notifications**: Email alerts for important events
- **Browser Push Notifications**: Native browser push notifications
- **SMS Notifications**: Critical alerts via SMS (requires Twilio setup)

### 3. User Preferences
Users can customize:
- Which notification types to receive
- Preferred delivery methods
- Quiet hours (with start and end times)
- Digest mode (daily or weekly summaries)
- Phone number for SMS alerts

### 4. Smart Delivery
- Respects user preferences before sending
- Checks quiet hours (except for urgent notifications)
- Validates delivery method preferences
- Supports digest mode for batched notifications

## Database Schema

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  company_id UUID REFERENCES companies,
  
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
  digest_frequency TEXT DEFAULT 'daily',
  phone_number TEXT
);
```

## Usage

### Frontend - Sending Notifications

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { sendNotification } = useNotifications();

  const sendMaintenanceAlert = () => {
    sendNotification.mutate({
      to: ['user-id-1', 'user-id-2'],
      subject: 'Vehicle Maintenance Due',
      type: 'maintenance',
      details: {
        vehicleId: 'vehicle-123',
        message: 'Oil change scheduled for tomorrow'
      },
      delivery: 'all', // or 'email', 'sms', 'in_app'
      companyId: 'company-123'
    });
  };

  return <button onClick={sendMaintenanceAlert}>Send Alert</button>;
}
```

### Managing User Preferences

Users can manage their notification preferences in the Settings page under the "Notifications" tab. The interface allows them to:

1. **Select Notification Types**: Choose which types of notifications they want to receive
2. **Configure Delivery Methods**: Enable/disable email, SMS, push, and in-app notifications
3. **Set Quiet Hours**: Define time ranges when non-urgent notifications should be suppressed
4. **Enable Digest Mode**: Receive notifications as daily or weekly summaries
5. **Add Phone Number**: Required for SMS notifications

### Edge Function - Send Notification

The `send-notification` edge function handles the actual delivery:

```typescript
// Automatically checks user preferences
// Respects quiet hours
// Filters by notification type preferences
// Only sends via enabled delivery methods
```

## Configuration

### Required Secrets

1. **RESEND_API_KEY**: For email notifications
   - Get from: https://resend.com/api-keys
   
2. **TWILIO_ACCOUNT_SID**: For SMS notifications (optional)
3. **TWILIO_AUTH_TOKEN**: For SMS notifications (optional)
4. **TWILIO_PHONE_NUMBER**: For SMS notifications (optional)

### Browser Push Notifications

Browser push notifications require user permission. The system will:
1. Request permission when user enables push notifications
2. Store the permission status
3. Show appropriate UI based on permission state

## Notification Preferences Logic

The system checks preferences in this order:

1. **Delivery Method Check**: Is the delivery method enabled?
2. **Notification Type Check**: Is this notification type enabled?
3. **Quiet Hours Check**: Are we in quiet hours? (skipped for urgent)
4. **Digest Mode Check**: Should this be batched? (future enhancement)

## Security

- Row-Level Security (RLS) enabled on preferences table
- Users can only view/edit their own preferences
- Edge function validates user permissions
- Phone numbers are stored securely
- SMS delivery requires explicit user opt-in

## Testing

1. **Enable Notifications**: Go to Settings > Notifications tab
2. **Configure Preferences**: Choose types and delivery methods
3. **Test Delivery**: Trigger a notification (e.g., create a maintenance alert)
4. **Verify Quiet Hours**: Set quiet hours and test during/outside that window
5. **Check SMS**: Add phone number and enable SMS for urgent alerts

## Future Enhancements

- [ ] Implement digest mode batch sending
- [ ] Add notification history/archive
- [ ] Support custom notification templates
- [ ] Add notification priority levels
- [ ] Implement read receipts
- [ ] Add notification analytics
- [ ] Support webhook notifications
- [ ] Multi-language notification support

## Troubleshooting

### Notifications Not Received

1. Check user preferences are correctly set
2. Verify delivery method is enabled
3. Check if in quiet hours
4. Ensure notification type is enabled
5. Check edge function logs for errors

### Push Notifications Not Working

1. Verify browser permission is granted
2. Check if push_enabled in preferences
3. Ensure HTTPS is being used
4. Test browser compatibility

### SMS Not Sending

1. Verify Twilio credentials are set
2. Check phone number format (+countrycode)
3. Ensure sms_enabled in preferences
4. Check Twilio account balance

## API Reference

### useNotifications Hook

```typescript
const {
  notifications,       // Array of user's notifications
  isLoading,          // Loading state
  sendNotification,   // Mutation to send notifications
  markAsRead,         // Mark notification as read
  markAllAsRead,      // Mark all as read
  getUnreadCount,     // Get count of unread notifications
} = useNotifications(limit);
```

### Notification Types

```typescript
type NotificationType = 
  | 'maintenance' 
  | 'vehicle_issue' 
  | 'document_expiry' 
  | 'user_action' 
  | 'approval_required' 
  | 'urgent';

type NotificationDelivery = 
  | 'in_app' 
  | 'email' 
  | 'sms' 
  | 'all';
```
