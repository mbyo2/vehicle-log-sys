import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateSecret, otpauthURL } from "https://esm.sh/speakeasy@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Create a Supabase client for the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate TOTP secret
    const secret = generateSecret({
      name: user.email || "Fleet Manager User",
      account: user.email || user.id,
      issuer: "Fleet Manager",
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = otpauthURL({
      secret: secret.base32,
      label: user.email || "Fleet Manager User",
      issuer: "Fleet Manager",
      type: "totp",
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store the secret in the database using service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: insertError } = await serviceClient
      .from("user_mfa_secrets")
      .upsert({
        user_id: user.id,
        secret: secret.base32,
        backup_codes: backupCodes,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error storing MFA secret:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store MFA secret" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const response: TwoFactorSetup = {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in setup-totp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);