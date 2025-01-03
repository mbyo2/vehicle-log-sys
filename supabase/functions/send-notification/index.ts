import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotification {
  to: string[];
  subject: string;
  type: 'maintenance' | 'vehicle_issue' | 'document_expiry' | 'user_action';
  details: Record<string, any>;
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: EmailNotification = await req.json();
    
    // Generate email content based on notification type
    let htmlContent = '';
    switch (notification.type) {
      case 'maintenance':
        htmlContent = `
          <h2>Maintenance Schedule Reminder</h2>
          <p>Vehicle: ${notification.details.vehicle}</p>
          <p>Service Type: ${notification.details.serviceType}</p>
          <p>Scheduled Date: ${notification.details.date}</p>
        `;
        break;
      case 'vehicle_issue':
        htmlContent = `
          <h2>Vehicle Issue Alert</h2>
          <p>Vehicle: ${notification.details.vehicle}</p>
          <p>Issue: ${notification.details.issue}</p>
          <p>Priority: ${notification.details.priority}</p>
        `;
        break;
      case 'document_expiry':
        htmlContent = `
          <h2>Document Expiry Alert</h2>
          <p>Vehicle: ${notification.details.vehicle}</p>
          <p>Document: ${notification.details.document}</p>
          <p>Expiry Date: ${notification.details.expiryDate}</p>
        `;
        break;
      case 'user_action':
        htmlContent = `
          <h2>Action Required</h2>
          <p>${notification.details.message}</p>
        `;
        break;
    }

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Fleet Manager <notifications@your-domain.com>",
        to: notification.to,
        subject: notification.subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      throw new Error("Failed to send email");
    }

    // Log notification in the database
    const { error: dbError } = await supabase
      .from('vehicle_notifications')
      .insert({
        type: notification.type,
        message: notification.subject,
        priority: notification.details.priority || 'medium',
        vehicle_id: notification.details.vehicleId,
        company_id: notification.details.companyId,
        due_date: notification.details.dueDate || null,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to log notification");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);