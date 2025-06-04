
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

    // First, let's try a simple connection test
    console.log("Testing database connection...");
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (connectionError) {
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

    // Check if profiles table exists
    console.log("Checking if profiles table exists...");
    const { data: tableExists } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .maybeSingle();

    if (!tableExists) {
      console.log("Profiles table doesn't exist, creating it...");
      
      // Create user_role enum if it doesn't exist
      console.log("Creating user_role enum...");
      const { error: enumError } = await supabaseClient.rpc('exec_sql', {
        sql: `
          DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'supervisor', 'driver');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      });

      if (enumError) {
        console.error("Error creating user_role enum:", enumError);
      }

      // Create subscription_type enum if it doesn't exist
      console.log("Creating subscription_type enum...");
      const { error: subEnumError } = await supabaseClient.rpc('exec_sql', {
        sql: `
          DO $$ BEGIN
            CREATE TYPE subscription_type AS ENUM ('trial', 'full');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      });

      if (subEnumError) {
        console.error("Error creating subscription_type enum:", subEnumError);
      }

      // Create the profiles table
      console.log("Creating profiles table...");
      const { error: createError } = await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email text NOT NULL,
            full_name text,
            role user_role DEFAULT 'driver',
            company_id uuid,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            two_factor_enabled boolean DEFAULT false,
            two_factor_method text DEFAULT 'email',
            two_factor_secret text
          );
        `
      });

      if (createError) {
        console.error("Error creating profiles table:", createError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create profiles table: ${createError.message}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      // Enable RLS
      console.log("Enabling RLS on profiles table...");
      await supabaseClient.rpc('exec_sql', {
        sql: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
      });

      // Create RLS policies
      console.log("Creating RLS policies...");
      await supabaseClient.rpc('exec_sql', {
        sql: `
          -- Drop existing policies first
          DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
          DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
          DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
          DROP POLICY IF EXISTS "Authenticated users can insert" ON public.profiles;

          -- Allow users to read their own profile
          CREATE POLICY "Users can read own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);

          -- Allow users to update their own profile
          CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);

          -- Allow service role to do anything
          CREATE POLICY "Service role full access" ON public.profiles
            FOR ALL USING (auth.role() = 'service_role');

          -- Allow authenticated users to insert
          CREATE POLICY "Authenticated users can insert" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        `
      });

      // Create or replace trigger function
      console.log("Creating trigger function...");
      await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS trigger AS $$
          BEGIN
            INSERT INTO public.profiles (id, email, full_name, role)
            VALUES (
              new.id,
              new.email,
              COALESCE(new.raw_user_meta_data->>'full_name', ''),
              COALESCE((new.raw_user_meta_data->>'role')::user_role, 'driver'::user_role)
            );
            RETURN new;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });

      // Create trigger
      console.log("Creating trigger...");
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `
      });

      console.log("Database setup completed successfully");
    } else {
      console.log("Profiles table already exists");
    }

    // Get current profile count
    console.log("Counting existing profiles...");
    const { count, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting profiles:", countError);
      // Don't fail here, just assume 0 profiles
    }

    const profileCount = count || 0;
    console.log("Current profile count:", profileCount);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database setup completed successfully',
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
