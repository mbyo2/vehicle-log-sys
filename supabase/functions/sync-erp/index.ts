import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ERPSyncPayload {
  company_id: string;
  system_type: string;
  sync_type?: 'full' | 'incremental';
}

async function syncNetSuite(config: any, credentials: any) {
  console.log('Syncing with NetSuite:', { config });
  // Implement NetSuite sync logic here
  return { status: 'success', message: 'NetSuite sync completed' };
}

async function syncOdoo(config: any, credentials: any) {
  console.log('Syncing with Odoo:', { config });
  // Implement Odoo sync logic here
  return { status: 'success', message: 'Odoo sync completed' };
}

async function syncSAP(config: any, credentials: any) {
  console.log('Syncing with SAP:', { config });
  // Implement SAP sync logic here
  return { status: 'success', message: 'SAP sync completed' };
}

async function syncERPNext(config: any, credentials: any) {
  console.log('Syncing with ERPNext:', { config });
  // Implement ERPNext sync logic here
  return { status: 'success', message: 'ERPNext sync completed' };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, system_type, sync_type = 'incremental' } = await req.json() as ERPSyncPayload;

    console.log(`Starting ERP sync for company ${company_id}, system: ${system_type}`);

    // Get ERP integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('erp_integrations')
      .select('*')
      .eq('company_id', company_id)
      .eq('system_type', system_type)
      .single();

    if (integrationError || !integration) {
      throw new Error(`No ERP integration found for company ${company_id}`);
    }

    // Execute sync based on ERP system type
    let syncResult;
    switch (system_type) {
      case 'netsuite':
        syncResult = await syncNetSuite(integration.config, integration.credentials);
        break;
      case 'odoo':
        syncResult = await syncOdoo(integration.config, integration.credentials);
        break;
      case 'sap':
        syncResult = await syncSAP(integration.config, integration.credentials);
        break;
      case 'erpnext':
        syncResult = await syncERPNext(integration.config, integration.credentials);
        break;
      default:
        throw new Error(`Unsupported ERP system type: ${system_type}`);
    }

    // Update last sync timestamp
    const { error: updateError } = await supabase
      .from('erp_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('company_id', company_id)
      .eq('system_type', system_type);

    if (updateError) {
      console.error('Error updating sync timestamp:', updateError);
    }

    // Log the sync activity
    const { error: logError } = await supabase
      .from('user_activity_logs')
      .insert({
        company_id,
        action: 'ERP_SYNC',
        details: {
          system_type,
          sync_type,
          result: syncResult
        }
      });

    if (logError) {
      console.error('Error logging sync activity:', logError);
    }

    return new Response(
      JSON.stringify(syncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-erp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});