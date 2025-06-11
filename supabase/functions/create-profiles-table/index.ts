
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Database setup function called");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Simple connection test
    console.log("Testing database connection...");
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('profiles')
      .select('id')
      .limit(1);

    if (connectionError && !connectionError.message.includes('relation "profiles" does not exist')) {
      console.error("Database connection failed:", connectionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database connection failed: ${connectionError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log("Database connection successful");

    // Get current profile count
    console.log("Counting existing profiles...");
    const { count, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const profileCount = count || 0;
    console.log("Current profile count:", profileCount);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database check completed successfully',
        profileCount: profileCount,
        isFirstUser: profileCount === 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Database setup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
