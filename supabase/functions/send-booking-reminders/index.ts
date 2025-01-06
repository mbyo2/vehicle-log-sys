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

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting reminder check process");

    // Get bookings that need reminders
    const { data: bookings, error: fetchError } = await supabase
      .from('service_bookings')
      .select(`
        id,
        booking_date,
        service_type,
        vehicles (
          plate_number,
          make,
          model
        ),
        service_centers (
          name,
          email
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .gt('booking_date', new Date().toISOString())
      .lte('booking_date', new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${bookings?.length || 0} bookings that need reminders`);

    if (!bookings?.length) {
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send reminders for each booking
    const reminderPromises = bookings.map(async (booking) => {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Service Booking Reminder</h2>
          <p>This is a reminder about your upcoming service booking:</p>
          <ul>
            <li>Vehicle: ${booking.vehicles[0].plate_number} (${booking.vehicles[0].make} ${booking.vehicles[0].model})</li>
            <li>Service Type: ${booking.service_type}</li>
            <li>Date: ${new Date(booking.booking_date).toLocaleDateString()}</li>
            <li>Time: ${new Date(booking.booking_date).toLocaleTimeString()}</li>
            <li>Service Center: ${booking.service_centers[0].name}</li>
          </ul>
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
          to: [booking.service_centers[0].email],
          subject: `Service Reminder - ${booking.vehicles[0].plate_number}`,
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send reminder for booking ${booking.id}`);
      }

      // Update booking reminder status
      const { error: updateError } = await supabase
        .from('service_bookings')
        .update({ 
          reminder_sent: true,
          reminder_settings: {
            ...booking.reminder_settings,
            last_reminder_sent: new Date().toISOString()
          }
        })
        .eq('id', booking.id);

      if (updateError) {
        throw updateError;
      }

      return booking.id;
    });

    const results = await Promise.allSettled(reminderPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Processed ${results.length} reminders. Success: ${successful}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} reminders`,
        successful,
        failed
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: failed > 0 ? 207 : 200
      }
    );

  } catch (error) {
    console.error("Error processing reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});