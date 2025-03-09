
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
  to: string[]; // user IDs or email addresses
  subject: string;
  type: "maintenance" | "vehicle_issue" | "document_expiry" | "user_action" | "approval_required" | "urgent";
  details: Record<string, any>;
  delivery?: "in_app" | "email" | "sms" | "all";
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
    const { to, subject, type, details, delivery = "in_app" } = notification;
    
    console.log(`Processing notification: ${type} via ${delivery}`);
    
    // Get user details for all recipients
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, company_id')
      .in('id', to);

    if (usersError) {
      throw new Error(`Failed to fetch user details: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      throw new Error('No valid recipients found');
    }

    // Process in-app notifications
    if (delivery === 'in_app' || delivery === 'all') {
      await Promise.all(users.map(async (user) => {
        await supabase
          .from('vehicle_notifications')
          .insert({
            type,
            message: details.message || subject,
            priority: getPriorityFromType(type),
            company_id: user.company_id,
            metadata: {
              ...details,
              user_id: user.id,
              subject
            },
            status: 'unread'
          });
      }));
    }

    // Process email notifications
    if (delivery === 'email' || delivery === 'all') {
      await Promise.all(users.map(async (user) => {
        if (!user.email) return;
        
        // Create email content
        const emailHtml = generateEmailTemplate({
          type,
          subject,
          message: details.message || '',
          userName: user.full_name || '',
          details
        });

        // Send email using Resend
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Fleet Manager <notifications@resend.dev>",
            to: [user.email],
            subject: subject,
            html: emailHtml,
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          console.error(`Email sending failed for ${user.email}:`, error);
        }
      }));
    }

    // Process SMS notifications
    if ((delivery === 'sms' || delivery === 'all') && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      const urgentTypes = ['urgent', 'vehicle_issue'];
      
      // Only send SMS for urgent notifications if type is not explicitly urgent
      if (urgentTypes.includes(type) || delivery === 'sms') {
        await Promise.all(users.filter(user => user.phone_number).map(async (user) => {
          const message = `${subject}: ${details.message || ''}`;
          await sendSMS(user.phone_number, message);
        }));
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
