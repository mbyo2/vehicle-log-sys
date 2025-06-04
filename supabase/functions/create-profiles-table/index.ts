
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

    // Create user_role enum if it doesn't exist
    console.log("Creating user_role enum...");
    try {
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DO $$ BEGIN
            CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'supervisor', 'driver');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      });
    } catch (error) {
      console.log("User role enum creation handled:", error);
    }

    // Create subscription_type enum if it doesn't exist
    console.log("Creating subscription_type enum...");
    try {
      await supabaseClient.rpc('exec_sql', {
        sql: `
          DO $$ BEGIN
            CREATE TYPE subscription_type AS ENUM ('trial', 'full');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `
      });
    } catch (error) {
      console.log("Subscription type enum creation handled:", error);
    }

    // Check if profiles table exists
    console.log("Checking if profiles table exists...");
    const { data: tableExists } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .single();

    if (!tableExists) {
      console.log("Creating profiles table...");
      
      // Create the profiles table
      const { error: createError } = await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE TABLE public.profiles (
            id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            full_name text,
            role user_role DEFAULT 'driver',
            company_name text,
            subscription_type subscription_type DEFAULT 'trial',
            subscription_start_date timestamptz DEFAULT now(),
            subscription_end_date timestamptz,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
        `
      });

      if (createError) {
        console.error("Error creating profiles table:", createError);
        throw createError;
      }

      // Enable RLS
      console.log("Enabling RLS on profiles table...");
      await supabaseClient.rpc('exec_sql', {
        sql: `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
      });

      // Create simple, non-recursive policies
      console.log("Creating RLS policies...");
      await supabaseClient.rpc('exec_sql', {
        sql: `
          -- Allow users to read their own profile
          CREATE POLICY "Users can read own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);

          -- Allow users to update their own profile
          CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);

          -- Allow service role to do anything (for admin operations)
          CREATE POLICY "Service role full access" ON public.profiles
            FOR ALL USING (auth.role() = 'service_role');

          -- Allow authenticated users to insert (for signup)
          CREATE POLICY "Authenticated users can insert" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        `
      });

      // Create trigger function
      console.log("Creating trigger function...");
      await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS trigger AS $$
          BEGIN
            INSERT INTO public.profiles (id, full_name, role)
            VALUES (
              new.id,
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

      console.log("Profiles table created successfully");
    } else {
      console.log("Profiles table already exists");
    }

    // Get current profile count
    const { count, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting profiles:", countError);
      throw countError;
    }

    console.log("Current profile count:", count);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database setup completed successfully',
        profileCount: count || 0
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
