import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const handler = async (req: Request): Promise<Response> => {
  console.log("Starting document reminders check...");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get vehicles with documents expiring in the next 30 days
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        plate_number,
        company_id,
        road_tax_expiry,
        insurance_expiry,
        companies (
          name
        )
      `)
      .or(`
        and(road_tax_expiry.gte.${today.toISOString()},road_tax_expiry.lte.${thirtyDaysFromNow.toISOString()}),
        and(insurance_expiry.gte.${today.toISOString()},insurance_expiry.lte.${thirtyDaysFromNow.toISOString()})
      `);

    if (vehiclesError) {
      throw vehiclesError;
    }

    console.log(`Found ${vehicles?.length || 0} vehicles with upcoming document expiries`);

    // Get company admins for notifications
    for (const vehicle of vehicles || []) {
      const { data: admins, error: adminsError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('company_id', vehicle.company_id)
        .eq('role', 'company_admin');

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
        continue;
      }

      const adminEmails = admins?.map(admin => admin.email) || [];
      
      if (adminEmails.length === 0) {
        console.log(`No admins found for company ${vehicle.company_id}`);
        continue;
      }

      // Check road tax expiry
      if (vehicle.road_tax_expiry) {
        const daysToRoadTaxExpiry = Math.ceil(
          (new Date(vehicle.road_tax_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysToRoadTaxExpiry <= 30) {
          // Send email using Resend
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Fleet Manager <notifications@resend.dev>",
              to: adminEmails,
              subject: `Road Tax Expiry Reminder - ${vehicle.plate_number}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Road Tax Expiry Reminder</h2>
                  <p>The road tax for vehicle ${vehicle.plate_number} will expire in ${daysToRoadTaxExpiry} days.</p>
                  <p>Please ensure to renew it before the expiry date: ${new Date(vehicle.road_tax_expiry).toLocaleDateString()}</p>
                </div>
              `,
            }),
          });

          // Log notification in the system
          await supabase.from('vehicle_notifications').insert({
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            type: 'document_expiry',
            message: `Road tax for vehicle ${vehicle.plate_number} will expire in ${daysToRoadTaxExpiry} days`,
            priority: daysToRoadTaxExpiry <= 7 ? 'high' : 'medium',
          });
        }
      }

      // Check insurance expiry
      if (vehicle.insurance_expiry) {
        const daysToInsuranceExpiry = Math.ceil(
          (new Date(vehicle.insurance_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysToInsuranceExpiry <= 30) {
          // Send email using Resend
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Fleet Manager <notifications@resend.dev>",
              to: adminEmails,
              subject: `Insurance Expiry Reminder - ${vehicle.plate_number}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Insurance Expiry Reminder</h2>
                  <p>The insurance for vehicle ${vehicle.plate_number} will expire in ${daysToInsuranceExpiry} days.</p>
                  <p>Please ensure to renew it before the expiry date: ${new Date(vehicle.insurance_expiry).toLocaleDateString()}</p>
                </div>
              `,
            }),
          });

          // Log notification in the system
          await supabase.from('vehicle_notifications').insert({
            vehicle_id: vehicle.id,
            company_id: vehicle.company_id,
            type: 'document_expiry',
            message: `Insurance for vehicle ${vehicle.plate_number} will expire in ${daysToInsuranceExpiry} days`,
            priority: daysToInsuranceExpiry <= 7 ? 'high' : 'medium',
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-document-reminders function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);