import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, getAuthedCaller, isAdminRole, unauthorized, forbidden } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Require admin caller — this function writes to integration / fuel / maintenance data.
  const caller = await getAuthedCaller(req)
  if (!caller) return unauthorized()
  if (!isAdminRole(caller.role)) return forbidden('Admin role required')

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, action, payload } = await req.json()

    console.log(`Processing ${action} for integration type: ${type}`)

    // Validate that any targeted vehicle belongs to the caller's company.
    const vehicleId = payload?.vehicleId;
    if (vehicleId) {
      const { data: v } = await supabaseClient
        .from('vehicles')
        .select('company_id')
        .eq('id', vehicleId)
        .maybeSingle();
      if (!v) return new Response(JSON.stringify({ error: 'Vehicle not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (caller.role !== 'super_admin' && v.company_id !== caller.companyId) {
        return forbidden('Vehicle not in your company');
      }
      // The integration record itself is tenant-scoped, so a company is required.
      if (!v.company_id) return forbidden('Vehicle has no company');
    } else if (!caller.companyId && caller.role !== 'super_admin') {
      return forbidden('No company for this account');
    }

    // Handle different integration types
    switch (type) {
      case 'fuel_card':
        return await handleFuelCardIntegration(action, payload, supabaseClient, caller);

      case 'gps':
        return await handleGPSIntegration(action, payload, supabaseClient);

      case 'maintenance':
        return await handleMaintenanceIntegration(action, payload, supabaseClient, caller);

      default:
        throw new Error(`Unsupported integration type: ${type}`)
    }
  } catch (error) {
    console.error('Error processing integration:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Stores one integration record per vehicle + type, scoped to the owning company.
 * Re-connecting updates the existing record instead of creating duplicates.
 */
async function saveIntegration(
  supabaseClient: any,
  caller: { companyId: string | null; role: string | null },
  vehicleId: string,
  type: string,
  name: string,
  config: Record<string, unknown>,
  encryptedConfig: string | null
) {
  // Keep one record per vehicle + type: update the existing one instead of
  // inserting a duplicate every time a provider is re-connected.
  const { data: existing } = await supabaseClient
    .from('external_integrations')
    .select('id, config')
    .eq('type', type);

  const found = (existing || []).find((row: any) => row.config?.vehicle_id === vehicleId);
  const targetId: string | null = found?.id ?? null;

  // Scope the record to the vehicle's own company, so a super-admin acting on
  // another company's vehicle still files the integration with the right tenant.
  const { data: vehicle } = await supabaseClient
    .from('vehicles')
    .select('company_id')
    .eq('id', vehicleId)
    .maybeSingle();
  const companyId = vehicle?.company_id ?? caller.companyId;
  if (!companyId) throw new Error('Vehicle has no company');

  const payload = {
    type,
    name,
    company_id: companyId,
    config: { ...config, vehicle_id: vehicleId },
    is_active: true,
  };

  if (targetId) {
    const update: Record<string, unknown> = { ...payload, updated_at: new Date().toISOString() };
    if (encryptedConfig) update.encrypted_config = encryptedConfig;
    const { error } = await supabaseClient
      .from('external_integrations')
      .update(update)
      .eq('id', targetId);
    if (error) throw error;
    return targetId;
  }

  const insert: Record<string, unknown> = { ...payload };
  if (encryptedConfig) insert.encrypted_config = encryptedConfig;
  const { data, error } = await supabaseClient
    .from('external_integrations')
    .insert(insert)
    .select('id')
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

async function handleFuelCardIntegration(action, payload, supabaseClient, caller) {
  console.log('Handling fuel card integration:', action);

  switch (action) {
    case 'connect':
      if (!payload?.cardNumber) throw new Error('Card number is required');

      // Encrypt the card number before it is ever written to the database.
      const { data: encFuel, error: encFuelErr } = await supabaseClient.rpc(
        'encrypt_integration_credentials',
        { credentials_data: { card_number: payload.cardNumber } }
      );
      if (encFuelErr) throw encFuelErr;

      await saveIntegration(
        supabaseClient,
        caller,
        payload.vehicleId,
        'fuel_card',
        'Fuel Card Integration',
        { connected_at: new Date().toISOString() },
        encFuel
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Fuel card details saved. Transactions are only imported once a live fuel card provider is connected.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    case 'sync_transactions':
      // No live fuel card provider is connected, so there is nothing to import.
      // Nothing is written here: fabricated transactions must never enter the fuel log.
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          data: [],
          message: 'No live fuel card provider is connected yet, so no transactions were imported.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    default:
      throw new Error(`Unsupported fuel card action: ${action}`);
  }
}

async function handleGPSIntegration(action, payload, supabaseClient) {
  console.log('Handling GPS integration:', action);

  switch (action) {
    case 'update_location':
      // Store the location update in the database
      const { vehicleId, latitude, longitude, timestamp } = payload;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Latitude and longitude must be numbers');
      }

      // First, get the vehicle details for additional context
      const { data: vehicleData } = await supabaseClient
        .from('vehicles')
        .select('plate_number')
        .eq('id', vehicleId)
        .single();

      // Create a notification for this location update
      await supabaseClient
        .from('vehicle_notifications')
        .insert({
          vehicle_id: vehicleId,
          type: 'gps_update',
          message: `Location updated for ${vehicleData?.plate_number || 'vehicle'}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${timestamp ? ` at ${timestamp}` : ''}`,
          priority: 'low'
        });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Location updated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    default:
      throw new Error(`Unsupported GPS action: ${action}`);
  }
}

async function handleMaintenanceIntegration(action, payload, supabaseClient, caller) {
  console.log('Handling maintenance provider integration:', action);

  switch (action) {
    case 'connect_provider':
      const providerName = String(payload?.providerName ?? '').trim();
      if (!providerName) throw new Error('Provider name is required');
      if (!payload?.accountNumber) throw new Error('Account or reference number is required');

      // Encrypt sensitive account number before storage
      const { data: encMaint, error: encMaintErr } = await supabaseClient.rpc(
        'encrypt_integration_credentials',
        { credentials_data: { account_number: payload.accountNumber } }
      );
      if (encMaintErr) throw encMaintErr;

      await saveIntegration(
        supabaseClient,
        caller,
        payload.vehicleId,
        'maintenance_provider',
        'Maintenance Provider Integration',
        {
          provider_name: providerName,
          connected_at: new Date().toISOString(),
        },
        encMaint
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Saved ${providerName} as the maintenance provider for this vehicle.`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    case 'get_schedule':
      // Read the vehicle's real scheduled maintenance from the database.
      const { data: schedules, error } = await supabaseClient
        .from('maintenance_schedules')
        .select('id, service_type, scheduled_date, status')
        .eq('vehicle_id', payload.vehicleId);

      if (error) throw error;

      // Label each entry with the provider saved for this vehicle, if any.
      const { data: integration } = await supabaseClient
        .from('external_integrations')
        .select('config')
        .eq('type', 'maintenance_provider')
        .maybeSingle();

      const providerLabel =
        (integration as any)?.config?.provider_name || 'Not specified';

      const formattedSchedules = (schedules || []).map(schedule => ({
        id: schedule.id,
        provider: providerLabel,
        scheduledDate: schedule.scheduled_date,
        serviceType: schedule.service_type,
        status: schedule.status
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: formattedSchedules
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    default:
      throw new Error(`Unsupported maintenance action: ${action}`);
  }
}
