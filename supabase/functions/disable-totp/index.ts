import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client for the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Remove MFA secret from database
    const { error: deleteError } = await supabaseService
      .from('user_mfa_secrets')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error disabling MFA:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to disable two-factor authentication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user profile to disable 2FA
    const { error: profileError } = await supabaseService
      .from('profiles')
      .update({ two_factor_enabled: false })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Disable TOTP error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});