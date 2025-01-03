import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotification {
  type: "maintenance_due" | "document_expiry" | "vehicle_issue";
  vehicleId: string;
  userId: string;
  details: {
    title: string;
    message: string;
  };
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
    const notification: EmailNotification = await req.json();
    
    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*, company:companies(name)')
      .eq('id', notification.vehicleId)
      .single();

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', notification.userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Create email content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.details.title}</h2>
        <p>${notification.details.message}</p>
        <div style="margin-top: 20px;">
          <h3>Vehicle Details:</h3>
          <p>Plate Number: ${vehicle.plate_number}</p>
          <p>Make: ${vehicle.make}</p>
          <p>Model: ${vehicle.model}</p>
          <p>Company: ${vehicle.company.name}</p>
        </div>
      </div>
    `;

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
        subject: notification.details.title,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    // Log the notification
    await supabase
      .from('vehicle_notifications')
      .insert({
        vehicle_id: notification.vehicleId,
        type: notification.type,
        message: notification.details.message,
        priority: notification.type === 'vehicle_issue' ? 'high' : 'medium',
        company_id: vehicle.company_id,
      });

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

serve(handler);