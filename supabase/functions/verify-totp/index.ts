// Supabase Edge Function: verify-totp
// Verifies a TOTP code securely on the server side using the user's stored MFA secret

import { createClient } from 'npm:@supabase/supabase-js@2.47.8';
import speakeasy from 'npm:speakeasy@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticated user client (to read auth user from JWT)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { code } = await req.json().catch(() => ({ code: '' }));
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid code format' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Server-side client with elevated permissions to read secrets
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: secretRow, error: secretError } = await adminClient
      .from('user_mfa_secrets')
      .select('secret')
      .eq('user_id', user.id)
      .single();

    if (secretError || !secretRow?.secret) {
      return new Response(JSON.stringify({ success: false, error: 'MFA secret not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const verified = speakeasy.totp.verify({
      secret: secretRow.secret,
      encoding: 'base32',
      token: code,
      window: 2, // allow +/- 1 time step
    });

    if (verified) {
      // Update the user's profile to enable 2FA
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to update profile" }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }

    return new Response(JSON.stringify({ success: !!verified }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Verification failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
