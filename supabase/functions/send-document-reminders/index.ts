
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

// Send an email notification using Resend API
async function sendEmailNotification(
  to: string[], 
  subject: string, 
  htmlContent: string
) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Fleet Manager <notifications@resend.dev>",
        to,
        subject,
        html: htmlContent,
      }),
    });
    console.log(`Email sent to ${to.join(', ')}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Create in-app notification in both tables for comprehensive coverage
async function createInAppNotification(notificationData: {
  vehicle_id?: string;
  company_id: string;
  type: string;
  message: string;
  priority: string;
  user_ids?: string[];
}) {
  try {
    // Create vehicle notification (legacy)
    await supabase.from('vehicle_notifications').insert({
      vehicle_id: notificationData.vehicle_id,
      company_id: notificationData.company_id,
      type: notificationData.type,
      message: notificationData.message,
      priority: notificationData.priority,
    });

    // Create in-app notifications for each user (new notification center)
    if (notificationData.user_ids && notificationData.user_ids.length > 0) {
      const notifications = notificationData.user_ids.map(userId => ({
        user_id: userId,
        company_id: notificationData.company_id,
        type: notificationData.type,
        title: notificationData.type === 'document_expiry' ? 'Document Expiring' : 'Alert',
        message: notificationData.message,
        data: { vehicle_id: notificationData.vehicle_id, priority: notificationData.priority },
        is_read: false,
      }));
      
      await supabase.from('notifications').insert(notifications);
    }
    
    console.log(`Notification created: ${notificationData.message}`);
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

// Fetch vehicles with expiring documents
async function fetchVehiclesWithExpiringDocuments(
  today: Date, 
  thirtyDaysFromNow: Date
) {
  const { data, error } = await supabase
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

  if (error) throw error;
  return data || [];
}

// Fetch documents that are expiring soon
async function fetchExpiringDocuments(
  today: Date, 
  thirtyDaysFromNow: Date
) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      name,
      type,
      expiry_date,
      company_id,
      vehicle_id,
      driver_id
    `)
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

  if (error) throw error;
  return data || [];
}

// Fetch company admins for a specific company
async function fetchCompanyAdmins(companyId: string) {
  // Get admins from user_roles table
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('role', 'company_admin');

  if (roleError || !roleData?.length) {
    console.error('Error fetching admin roles:', roleError);
    return [];
  }

  const userIds = roleData.map(r => r.user_id);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
  return data || [];
}

// Fetch drivers with expiring licenses
async function fetchDriversWithExpiringLicenses(today: Date, thirtyDaysFromNow: Date) {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      id,
      man_number,
      license_expiry,
      company_id,
      profile_id,
      profiles:profile_id (
        full_name,
        email
      )
    `)
    .gte('license_expiry', today.toISOString().split('T')[0])
    .lte('license_expiry', thirtyDaysFromNow.toISOString().split('T')[0]);

  if (error) throw error;
  return data || [];
}

// Process vehicle document expirations
async function processVehicleExpirations(
  vehicles: any[], 
  companyAdmins: Map<string, any[]>
) {
  const today = new Date();
  
  for (const vehicle of vehicles) {
    const adminEmails = companyAdmins.get(vehicle.company_id)?.map(admin => admin.email) || [];
    
    if (adminEmails.length === 0) {
      console.log(`No admins found for company ${vehicle.company_id}`);
      continue;
    }

    // Process road tax expiry
    if (vehicle.road_tax_expiry) {
      await processRoadTaxExpiry(vehicle, adminEmails, today);
    }

    // Process insurance expiry
    if (vehicle.insurance_expiry) {
      await processInsuranceExpiry(vehicle, adminEmails, today);
    }
  }
}

// Process road tax expiry for a vehicle
async function processRoadTaxExpiry(vehicle: any, adminEmails: string[], today: Date) {
  const daysToRoadTaxExpiry = Math.ceil(
    (new Date(vehicle.road_tax_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysToRoadTaxExpiry <= 30) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Road Tax Expiry Reminder</h2>
        <p>The road tax for vehicle ${vehicle.plate_number} will expire in ${daysToRoadTaxExpiry} days.</p>
        <p>Please ensure to renew it before the expiry date: ${new Date(vehicle.road_tax_expiry).toLocaleDateString()}</p>
      </div>
    `;

    await sendEmailNotification(
      adminEmails,
      `Road Tax Expiry Reminder - ${vehicle.plate_number}`,
      emailHtml
    );

    await createInAppNotification({
      vehicle_id: vehicle.id,
      company_id: vehicle.company_id,
      type: 'document_expiry',
      message: `Road tax for vehicle ${vehicle.plate_number} will expire in ${daysToRoadTaxExpiry} days`,
      priority: daysToRoadTaxExpiry <= 7 ? 'high' : 'medium',
    });
  }
}

// Process insurance expiry for a vehicle
async function processInsuranceExpiry(vehicle: any, adminEmails: string[], today: Date) {
  const daysToInsuranceExpiry = Math.ceil(
    (new Date(vehicle.insurance_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysToInsuranceExpiry <= 30) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Insurance Expiry Reminder</h2>
        <p>The insurance for vehicle ${vehicle.plate_number} will expire in ${daysToInsuranceExpiry} days.</p>
        <p>Please ensure to renew it before the expiry date: ${new Date(vehicle.insurance_expiry).toLocaleDateString()}</p>
      </div>
    `;

    await sendEmailNotification(
      adminEmails, 
      `Insurance Expiry Reminder - ${vehicle.plate_number}`,
      emailHtml
    );

    await createInAppNotification({
      vehicle_id: vehicle.id,
      company_id: vehicle.company_id,
      type: 'document_expiry',
      message: `Insurance for vehicle ${vehicle.plate_number} will expire in ${daysToInsuranceExpiry} days`,
      priority: daysToInsuranceExpiry <= 7 ? 'high' : 'medium',
    });
  }
}

// Get additional document details
async function getDocumentAdditionalInfo(document: any) {
  let additionalInfo = "";
  let notificationEntityId = document.company_id;
  
  if (document.vehicle_id) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('plate_number')
      .eq('id', document.vehicle_id)
      .single();
      
    if (vehicle) {
      additionalInfo = ` for vehicle ${vehicle.plate_number}`;
      notificationEntityId = document.vehicle_id;
    }
  } else if (document.driver_id) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('profiles(full_name)')
      .eq('id', document.driver_id)
      .single();
      
    if (driver && driver.profiles) {
      additionalInfo = ` for driver ${driver.profiles.full_name}`;
      notificationEntityId = document.driver_id;
    }
  }
  
  return { additionalInfo, notificationEntityId };
}

// Process general document expirations
async function processDocumentExpirations(
  documents: any[], 
  companyAdmins: Map<string, any[]>
) {
  const today = new Date();
  
  for (const document of documents) {
    if (!document.expiry_date || !document.company_id) continue;
    
    const adminEmails = companyAdmins.get(document.company_id)?.map(admin => admin.email) || [];
    
    if (adminEmails.length === 0) {
      console.log(`No admins found for company ${document.company_id}`);
      continue;
    }

    const daysToExpiry = Math.ceil(
      (new Date(document.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysToExpiry <= 30) {
      const { additionalInfo, notificationEntityId } = await getDocumentAdditionalInfo(document);
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Expiry Reminder</h2>
          <p>The document "${document.name}" (${document.type})${additionalInfo} will expire in ${daysToExpiry} days.</p>
          <p>Please ensure to renew it before the expiry date: ${new Date(document.expiry_date).toLocaleDateString()}</p>
        </div>
      `;

      await sendEmailNotification(
        adminEmails,
        `Document Expiry Reminder - ${document.name}`,
        emailHtml
      );

      await createInAppNotification({
        vehicle_id: document.vehicle_id,
        company_id: document.company_id,
        type: 'document_expiry',
        message: `Document "${document.name}"${additionalInfo} will expire in ${daysToExpiry} days`,
        priority: daysToExpiry <= 7 ? 'high' : 'medium',
      });
    }
  }
}

// Process driver license expirations
async function processDriverLicenseExpirations(
  drivers: any[], 
  companyAdmins: Map<string, any[]>
) {
  const today = new Date();
  
  for (const driver of drivers) {
    if (!driver.license_expiry || !driver.company_id) continue;
    
    const admins = companyAdmins.get(driver.company_id) || [];
    const adminEmails = admins.map(admin => admin.email);
    const adminIds = admins.map(admin => admin.id);
    
    if (adminEmails.length === 0) {
      console.log(`No admins found for company ${driver.company_id}`);
      continue;
    }

    const daysToExpiry = Math.ceil(
      (new Date(driver.license_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const driverName = driver.profiles?.full_name || driver.man_number;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Driver License Expiry Reminder</h2>
        <p>The driving license for ${driverName} will expire in ${daysToExpiry} days.</p>
        <p>Please ensure to renew it before the expiry date: ${new Date(driver.license_expiry).toLocaleDateString()}</p>
      </div>
    `;

    await sendEmailNotification(
      adminEmails,
      `Driver License Expiry - ${driverName}`,
      emailHtml
    );

    await createInAppNotification({
      company_id: driver.company_id,
      type: 'document_expiry',
      message: `Driving license for ${driverName} will expire in ${daysToExpiry} days`,
      priority: daysToExpiry <= 7 ? 'high' : 'medium',
      user_ids: adminIds,
    });
  }
}

// Main handler function
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

    // Fetch data
    const vehicles = await fetchVehiclesWithExpiringDocuments(today, thirtyDaysFromNow);
    const documents = await fetchExpiringDocuments(today, thirtyDaysFromNow);
    const drivers = await fetchDriversWithExpiringLicenses(today, thirtyDaysFromNow);

    console.log(`Found ${vehicles.length} vehicles with upcoming document expiries`);
    console.log(`Found ${documents.length} documents expiring soon`);
    console.log(`Found ${drivers.length} drivers with expiring licenses`);

    // Get company admins for notifications
    const allCompanyIds = new Set([
      ...(vehicles.map(v => v.company_id) || []),
      ...(documents.map(d => d.company_id) || []),
      ...(drivers.map(d => d.company_id) || [])
    ].filter(Boolean));
    
    const companyAdmins = new Map();
    
    for (const companyId of allCompanyIds) {
      if (!companyId) continue;
      
      const admins = await fetchCompanyAdmins(companyId);
      if (admins.length > 0) {
        companyAdmins.set(companyId, admins);
      }
    }

    // Process expirations
    await processVehicleExpirations(vehicles, companyAdmins);
    await processDocumentExpirations(documents, companyAdmins);
    await processDriverLicenseExpirations(drivers, companyAdmins);

    return new Response(JSON.stringify({ 
      success: true,
      processed: {
        vehicles: vehicles.length || 0,
        documents: documents.length || 0,
        drivers: drivers.length || 0
      }
    }), {
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
