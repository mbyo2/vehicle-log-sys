import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.8";
import * as speakeasy from "https://esm.sh/speakeasy@2.0.0";

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

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Fleet Manager (${user.email})`,
      issuer: 'Fleet Manager',
      length: 32
    });

    // Generate QR code URL
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: user.email,
      issuer: 'Fleet Manager',
      encoding: 'ascii'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Store the secret in the database (encrypted in a real implementation)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: insertError } = await supabaseService
      .from('user_mfa_secrets')
      .upsert({
        user_id: user.id,
        secret: secret.base32,
        is_active: false // Not active until verified
      });

    if (insertError) {
      console.error('Error storing MFA secret:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to setup two-factor authentication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`;

    return new Response(
      JSON.stringify({
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        backupCodes: backupCodes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup TOTP error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});