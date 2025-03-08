
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { type, action, payload } = await req.json()

    console.log(`Processing ${action} for integration type: ${type}`)

    // Handle different integration types
    switch (type) {
      case 'fuel_card':
        return await handleFuelCardIntegration(action, payload, supabaseClient);
      
      case 'gps':
        return await handleGPSIntegration(action, payload, supabaseClient);
      
      case 'maintenance':
        return await handleMaintenanceIntegration(action, payload, supabaseClient);
      
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

async function handleFuelCardIntegration(action, payload, supabaseClient) {
  console.log('Handling fuel card integration:', action, payload);
  
  switch (action) {
    case 'connect':
      // In a real implementation, this would validate and store the fuel card connection
      // For demo purposes, we're just simulating a successful connection
      
      // Store the connection in our database
      await supabaseClient
        .from('external_integrations')
        .upsert({
          type: 'fuel_card',
          name: 'Fuel Card Integration',
          config: {
            vehicle_id: payload.vehicleId,
            card_number: payload.cardNumber,
            connected_at: new Date().toISOString(),
          },
          is_active: true
        });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Fuel card connected successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    
    case 'sync_transactions':
      // In a real implementation, this would fetch transactions from a fuel card API
      // For demo purposes, we'll simulate some transactions
      
      const mockTransactions = [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          liters: 45.2,
          cost: 67.8,
          location: 'Shell Station #1234'
        },
        {
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          liters: 52.7,
          cost: 79.05,
          location: 'BP Station #5678'
        }
      ];
      
      // Store these transactions in our database
      for (const transaction of mockTransactions) {
        await supabaseClient
          .from('fuel_logs')
          .insert({
            vehicle_id: payload.vehicleId,
            liters_added: transaction.liters,
            total_cost: transaction.cost,
            cost_per_liter: transaction.cost / transaction.liters,
            odometer_reading: 0 // This would come from the fuel card data in a real implementation
          });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Fuel transactions synced successfully', 
          data: mockTransactions 
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
  console.log('Handling GPS integration:', action, payload);
  
  switch (action) {
    case 'update_location':
      // Store the location update in the database
      const { vehicleId, latitude, longitude, timestamp } = payload;
      
      // Update the vehicle's current location
      // In a real app, this might go to a specialized location tracking table
      
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
          message: `Location updated for ${vehicleData?.plate_number || 'vehicle'}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
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

async function handleMaintenanceIntegration(action, payload, supabaseClient) {
  console.log('Handling maintenance integration:', action, payload);
  
  switch (action) {
    case 'connect_provider':
      // Store the provider connection in the database
      await supabaseClient
        .from('external_integrations')
        .upsert({
          type: 'maintenance_provider',
          name: 'Maintenance Provider Integration',
          config: {
            vehicle_id: payload.vehicleId,
            provider_id: payload.providerId,
            account_number: payload.accountNumber,
            connected_at: new Date().toISOString(),
          },
          is_active: true
        });
      
      // Create a couple of mock scheduled maintenance entries
      const mockSchedules = [
        {
          service_type: 'Oil Change',
          scheduled_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          description: 'Regular oil change and filter replacement',
          estimated_cost: 75.0
        },
        {
          service_type: 'Tire Rotation',
          scheduled_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          description: 'Rotate tires to ensure even wear',
          estimated_cost: 45.0
        }
      ];
      
      for (const schedule of mockSchedules) {
        await supabaseClient
          .from('maintenance_schedules')
          .insert({
            vehicle_id: payload.vehicleId,
            ...schedule
          });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Maintenance provider connected successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    
    case 'get_schedule':
      // In a real implementation, this would fetch from the provider's API
      // For demo purposes, we'll fetch from our database
      
      const { data: schedules, error } = await supabaseClient
        .from('maintenance_schedules')
        .select('id, service_type, scheduled_date, status')
        .eq('vehicle_id', payload.vehicleId);
      
      if (error) throw error;
      
      // Transform to the expected format
      const formattedSchedules = schedules.map(schedule => ({
        id: schedule.id,
        provider: 'Connected Provider', // This would come from the provider in a real implementation
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
