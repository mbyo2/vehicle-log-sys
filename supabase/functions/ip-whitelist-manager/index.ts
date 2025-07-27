import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IPWhitelistRequest {
  action: 'add' | 'remove' | 'list' | 'check';
  ip_address?: string;
  description?: string;
  company_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only company admins and super admins can manage IP whitelist
    if (profile.role !== 'company_admin' && profile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ip_address, description, company_id }: IPWhitelistRequest = await req.json();

    console.log(`IP whitelist ${action} request for user ${user.id}`);

    const targetCompanyId = profile.role === 'super_admin' && company_id ? company_id : profile.company_id;

    switch (action) {
      case 'add':
        return await addIPToWhitelist(supabaseClient, ip_address!, description || '', targetCompanyId, user.id);
      
      case 'remove':
        return await removeIPFromWhitelist(supabaseClient, ip_address!, targetCompanyId);
      
      case 'list':
        return await listWhitelistedIPs(supabaseClient, targetCompanyId);
      
      case 'check':
        return await checkIPWhitelist(supabaseClient, ip_address!, targetCompanyId);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('IP whitelist manager error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function addIPToWhitelist(
  supabaseClient: any,
  ipAddress: string,
  description: string,
  companyId: string,
  userId: string
): Promise<Response> {
  try {
    // Validate IP address format
    if (!isValidIP(ipAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid IP address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if IP already exists
    const { data: existing, error: existingError } = await supabaseClient
      .from('ip_whitelist')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('company_id', companyId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'IP address already whitelisted' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add IP to whitelist
    const { data, error } = await supabaseClient
      .from('ip_whitelist')
      .insert({
        ip_address: ipAddress,
        description: description,
        company_id: companyId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Log security event
    await supabaseClient.rpc('log_security_event', {
      p_event_type: 'ip_whitelist_added',
      p_user_id: userId,
      p_company_id: companyId,
      p_risk_level: 'medium',
      p_event_data: {
        ip_address: ipAddress,
        description: description,
        action: 'added'
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'IP address added to whitelist',
        data: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to add IP to whitelist: ${error.message}`);
  }
}

async function removeIPFromWhitelist(
  supabaseClient: any,
  ipAddress: string,
  companyId: string
): Promise<Response> {
  try {
    const { data, error } = await supabaseClient
      .from('ip_whitelist')
      .delete()
      .eq('ip_address', ipAddress)
      .eq('company_id', companyId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'IP address not found in whitelist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log security event
    await supabaseClient.rpc('log_security_event', {
      p_event_type: 'ip_whitelist_removed',
      p_company_id: companyId,
      p_risk_level: 'medium',
      p_event_data: {
        ip_address: ipAddress,
        action: 'removed'
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'IP address removed from whitelist' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to remove IP from whitelist: ${error.message}`);
  }
}

async function listWhitelistedIPs(
  supabaseClient: any,
  companyId: string
): Promise<Response> {
  try {
    const { data, error } = await supabaseClient
      .from('ip_whitelist')
      .select(`
        id,
        ip_address,
        description,
        created_at,
        created_by,
        profiles:created_by(full_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to list whitelisted IPs: ${error.message}`);
  }
}

async function checkIPWhitelist(
  supabaseClient: any,
  ipAddress: string,
  companyId: string
): Promise<Response> {
  try {
    const { data, error } = await supabaseClient
      .from('ip_whitelist')
      .select('id, description')
      .eq('ip_address', ipAddress)
      .eq('company_id', companyId)
      .single();

    const isWhitelisted = !error && data;

    return new Response(
      JSON.stringify({ 
        success: true, 
        whitelisted: isWhitelisted,
        data: isWhitelisted ? data : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Failed to check IP whitelist: ${error.message}`);
  }
}

function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // CIDR notation validation
  const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || cidrRegex.test(ip);
}