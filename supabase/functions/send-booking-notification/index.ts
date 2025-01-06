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

interface BookingNotification {
  bookingId: string;
  type: 'confirmation' | 'reminder';
}

const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: BookingNotification = await req.json();
    
    // Get booking details with related data
    const { data: booking } = await supabase
      .from('service_bookings')
      .select(`
        *,
        vehicles (
          plate_number,
          make,
          model
        ),
        service_centers (
          name,
          address,
          contact_number,
          email
        )
      `)
      .eq('id', notification.bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', booking.company_id)
      .single();

    // Create email content
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.type === 'confirmation' ? 'Service Booking Confirmation' : 'Service Reminder'}</h2>
        <p>Vehicle Details:</p>
        <ul>
          <li>Plate Number: ${booking.vehicles.plate_number}</li>
          <li>Make: ${booking.vehicles.make}</li>
          <li>Model: ${booking.vehicles.model}</li>
        </ul>
        <p>Service Details:</p>
        <ul>
          <li>Service Type: ${booking.service_type}</li>
          <li>Date: ${new Date(booking.booking_date).toLocaleDateString()}</li>
          <li>Time: ${new Date(booking.booking_date).toLocaleTimeString()}</li>
        </ul>
        <p>Service Center:</p>
        <ul>
          <li>Name: ${booking.service_centers.name}</li>
          <li>Address: ${booking.service_centers.address}</li>
          <li>Contact: ${booking.service_centers.contact_number || 'N/A'}</li>
        </ul>
        ${booking.notes ? `<p>Additional Notes: ${booking.notes}</p>` : ''}
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
        to: [booking.service_centers.email],
        subject: `${notification.type === 'confirmation' ? 'New Service Booking' : 'Service Reminder'} - ${booking.vehicles.plate_number}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    // Update booking status if it's a confirmation
    if (notification.type === 'confirmation') {
      await supabase
        .from('service_bookings')
        .update({ status: 'confirmed' })
        .eq('id', notification.bookingId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);