
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string[]; // user IDs
  subject: string;
  type: "maintenance" | "vehicle_issue" | "document_expiry" | "user_action" | "approval_required" | "urgent";
  details: Record<string, any>;
  delivery?: "in_app" | "email" | "sms" | "all";
  companyId?: string;
}

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationRequest = await req.json();
    const { to, subject, type, details, delivery = "in_app", companyId } = notification;
    
    console.log(`Processing notification: ${type} via ${delivery}`);
    
    // Get user details for all recipients
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_id')
      .in('id', to);

    if (usersError) {
      throw new Error(`Failed to fetch user details: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error('No valid recipients found');
    }

    // Fetch notification preferences for each user
    const usersWithPreferences = await Promise.all(
      users.map(async (user) => {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .eq('company_id', companyId || user.company_id)
          .maybeSingle();

        return { ...user, preferences: prefs };
      })
    );

    // Helper function to check if notification should be sent
    const shouldSendNotification = (prefs: any, deliveryMethod: string): boolean => {
      if (!prefs) return true; // No preferences set, send all
      
      // Check delivery method
      if (deliveryMethod === 'email' && !prefs.email_enabled) return false;
      if (deliveryMethod === 'sms' && !prefs.sms_enabled) return false;
      if (deliveryMethod === 'push' && !prefs.push_enabled) return false;
      if (deliveryMethod === 'in_app' && !prefs.in_app_enabled) return false;

      // Check notification type
      if (type === 'maintenance' && !prefs.maintenance_reminders) return false;
      if (type === 'vehicle_issue' && !prefs.vehicle_issues) return false;
      if (type === 'document_expiry' && !prefs.document_expiry) return false;
      if (type === 'user_action' && !prefs.user_actions) return false;
      if (type === 'approval_required' && !prefs.approval_required) return false;
      if (type === 'urgent' && !prefs.urgent_alerts) return false;

      // Check quiet hours (skip for urgent)
      if (prefs.quiet_hours_enabled && type !== 'urgent') {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = prefs.quiet_hours_start.split(':').map(Number);
        const [endHour, endMin] = prefs.quiet_hours_end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime < endTime) {
          // Normal case: quiet hours within same day
          if (currentTime >= startTime && currentTime < endTime) return false;
        } else {
          // Quiet hours span midnight
          if (currentTime >= startTime || currentTime < endTime) return false;
        }
      }

      return true;
    };

    // Process in-app notifications
    if (delivery === 'in_app' || delivery === 'all') {
      const notificationsToSend = usersWithPreferences
        .filter(user => shouldSendNotification(user.preferences, 'in_app'))
        .map(user => ({
          type,
          message: details.message || subject,
          priority: getPriorityFromType(type),
          company_id: companyId || user.company_id,
          metadata: {
            ...details,
            user_id: user.id,
            subject
          },
          status: 'unread'
        }));

      if (notificationsToSend.length > 0) {
        const { error: notifError } = await supabase
          .from('vehicle_notifications')
          .insert(notificationsToSend);

        if (notifError) {
          console.error('Error creating in-app notifications:', notifError);
        } else {
          console.log(`Created ${notificationsToSend.length} in-app notifications`);
        }
      }
    }

    // Process email notifications
    if (delivery === 'email' || delivery === 'all') {
      const usersToEmail = usersWithPreferences.filter(user => 
        user.email && shouldSendNotification(user.preferences, 'email')
      );

      await Promise.all(usersToEmail.map(async (user) => {
        // Try to get custom template from database
        const template = await getNotificationTemplate(type, 'email', companyId || user.company_id);
        
        let emailSubject = subject;
        let emailHtml = '';
        
        if (template) {
          // Render template with variables
          const variables = {
            userName: user.full_name || '',
            ...details
          };
          const rendered = renderTemplate(template, variables);
          emailSubject = rendered.subject || subject;
          emailHtml = rendered.html || rendered.body;
        } else {
          // Fallback to default template generation
          emailHtml = generateEmailTemplate({
            type,
            subject,
            message: details.message || '',
            userName: user.full_name || '',
            details
          });
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Fleet Manager <notifications@resend.dev>",
            to: [user.email],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          console.error(`Email sending failed for ${user.email}:`, error);
        } else {
          console.log(`Email sent to ${user.email}`);
        }
      }));
    }

    // Process SMS notifications
    if ((delivery === 'sms' || delivery === 'all') && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      const usersToSMS = usersWithPreferences.filter(user => 
        shouldSendNotification(user.preferences, 'sms') && 
        user.preferences?.phone_number
      );

      await Promise.all(usersToSMS.map(async (user) => {
        // Try to get custom SMS template
        const template = await getNotificationTemplate(type, 'sms', companyId || user.company_id);
        
        let smsMessage = `${subject}: ${details.message || ''}`;
        
        if (template) {
          const variables = {
            userName: user.full_name || '',
            ...details
          };
          const rendered = renderTemplate(template, variables);
          smsMessage = rendered.body;
        }
        
        await sendSMS(user.preferences.phone_number, smsMessage);
      }));
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notifications processed successfully' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

// Function to send SMS using Twilio
async function sendSMS(phoneNumber: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials not configured, skipping SMS");
    return;
  }

  try {
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const params = new URLSearchParams();
    params.append('To', phoneNumber);
    params.append('From', TWILIO_PHONE_NUMBER);
    params.append('Body', message);

    const response = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Twilio API error: ${errorDetails}`);
    }
    
    console.log(`SMS sent successfully to ${phoneNumber}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

// Helper function to get template from database
async function getNotificationTemplate(
  notificationType: string,
  deliveryMethod: string,
  companyId: string | null
) {
  const { data: templates } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('notification_type', notificationType)
    .eq('delivery_method', deliveryMethod)
    .eq('is_active', true)
    .or(`company_id.eq.${companyId},company_id.is.null`)
    .order('company_id', { ascending: false, nullsFirst: false })
    .limit(1);

  return templates?.[0] || null;
}

// Helper function to render template with variables
function renderTemplate(template: any, variables: Record<string, any>) {
  let subject = template.subject_template || '';
  let body = template.body_template || '';
  let html = template.html_template || '';

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    subject = subject.replace(regex, String(value));
    body = body.replace(regex, String(value));
    html = html.replace(regex, String(value));
  });

  return { subject, body, html };
}

// Helper function to determine notification priority
function getPriorityFromType(type: string): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'urgent':
    case 'vehicle_issue':
      return 'high';
    case 'approval_required':
    case 'document_expiry':
      return 'medium';
    default:
      return 'low';
  }
}

// Generate HTML email template
function generateEmailTemplate({ type, subject, message, userName, details }: { 
  type: string; 
  subject: string; 
  message: string;
  userName: string;
  details: Record<string, any>;
}): string {
  // Get appropriate color based on notification type
  const getColor = () => {
    switch (type) {
      case 'urgent':
      case 'vehicle_issue':
        return '#dc2626'; // red
      case 'approval_required':
      case 'document_expiry':
        return '#f59e0b'; // amber
      default:
        return '#2563eb'; // blue
    }
  };

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${getColor()}; padding: 16px; color: white;">
        <h2 style="margin: 0;">${subject}</h2>
      </div>
      <div style="padding: 20px;">
        <p>Hello ${userName},</p>
        <p>${message}</p>
        ${details.expiry_date ? `<p>Expiry date: ${new Date(details.expiry_date).toLocaleDateString()}</p>` : ''}
        ${details.vehicle ? `<p>Vehicle: ${details.vehicle}</p>` : ''}
        ${details.actionRequired ? `<p><strong>Action required:</strong> ${details.actionRequired}</p>` : ''}
        ${details.link ? `<p><a href="${details.link}" style="display: inline-block; background-color: ${getColor()}; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">View Details</a></p>` : ''}
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
          This is an automated message from your Fleet Management System.
        </p>
      </div>
    </div>
  `;
}

serve(handler);
