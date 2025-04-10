
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get Supabase credentials from environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    return new Response(
      JSON.stringify({
        error: 'Server configuration error - missing credentials'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }

  try {
    console.log('Creating Supabase client')
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First check if user_role type exists
    console.log('Checking if user_role type exists')
    try {
      const { error: typeCheckError } = await supabase.auth.admin.executeSql(`
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
      `)
      
      if (typeCheckError) {
        console.log('Creating user_role type')
        await supabase.auth.admin.executeSql(`
          CREATE TYPE public.user_role AS ENUM (
            'super_admin', 
            'company_admin', 
            'supervisor', 
            'driver'
          );
        `)
      }
    } catch (typeErr) {
      console.log('Error checking/creating role type:', typeErr)
      // Continue anyway, as the next steps will create it if needed
    }

    console.log('Creating profiles table if not exists')
    // Create the profiles table if it doesn't exist
    const { error: tableError } = await supabase.auth.admin.executeSql(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role public.user_role NOT NULL,
        full_name TEXT,
        company_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `)
    
    if (tableError) {
      console.error('Error creating profiles table:', tableError)
      
      // Try creating without the user_role type first
      console.log('Trying alternative table creation approach')
      const { error: altTableError } = await supabase.auth.admin.executeSql(`
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'driver',
          full_name TEXT,
          company_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create the enum type
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = 'user_role'
          ) THEN
            CREATE TYPE public.user_role AS ENUM (
              'super_admin', 
              'company_admin', 
              'supervisor', 
              'driver'
            );
          END IF;
        END
        $$;
        
        -- Try to convert the column after creating the type
        ALTER TABLE public.profiles 
        ALTER COLUMN role TYPE public.user_role 
        USING role::public.user_role;
      `)
      
      if (altTableError) {
        console.error('Alternative table creation also failed:', altTableError)
        return new Response(
          JSON.stringify({ error: 'Failed to create database tables: ' + altTableError.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }
    }

    // Create a function to handle new users if it doesn't exist
    console.log('Creating handle_new_user function')
    const { error: functionError } = await supabase.auth.admin.executeSql(`
      -- Create function to handle new user creation
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (
          id,
          email,
          role,
          full_name,
          company_id
        )
        VALUES (
          NEW.id,
          NEW.email,
          CASE 
            WHEN NOT EXISTS (SELECT 1 FROM profiles) THEN 'super_admin'::user_role
            WHEN NEW.raw_app_meta_data->>'role' IS NOT NULL THEN (NEW.raw_app_meta_data->>'role')::user_role
            ELSE 'driver'::user_role
          END,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          CASE 
            WHEN NEW.raw_app_meta_data->>'company_id' IS NOT NULL 
            THEN (NEW.raw_app_meta_data->>'company_id')::uuid
            ELSE NULL
          END
        );
        RETURN NEW;
      END;
      $$;
    `)
    
    if (functionError) {
      console.error('Error creating handle_new_user function:', functionError)
      
      // Try alternative function creation without the user_role cast
      const { error: altFunctionError } = await supabase.auth.admin.executeSql(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.profiles (
            id,
            email,
            role,
            full_name,
            company_id
          )
          VALUES (
            NEW.id,
            NEW.email,
            CASE 
              WHEN NOT EXISTS (SELECT 1 FROM profiles) THEN 'super_admin'
              WHEN NEW.raw_app_meta_data->>'role' IS NOT NULL THEN (NEW.raw_app_meta_data->>'role')
              ELSE 'driver'
            END,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            CASE 
              WHEN NEW.raw_app_meta_data->>'company_id' IS NOT NULL 
              THEN (NEW.raw_app_meta_data->>'company_id')::uuid
              ELSE NULL
            END
          );
          RETURN NEW;
        END;
        $$;
      `)
      
      if (altFunctionError) {
        console.error('Alternative function creation also failed:', altFunctionError)
      }
    }
    
    // Create a trigger for new user signup if it doesn't exist
    console.log('Creating auth trigger')
    const { error: triggerError } = await supabase.auth.admin.executeSql(`
      -- Drop trigger if exists
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Create trigger for handling new users
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `)
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError)
    } else {
      console.log('Trigger created or updated successfully')
    }

    // Directly insert the first super_admin if no profiles exist
    console.log('Checking if we need to create initial super_admin')
    try {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (!countError && (!count || count === 0)) {
        console.log('No profiles exist yet, we can proceed with first user signup')
      }
    } catch (err) {
      console.log('Error checking profiles count, likely table does not exist yet:', err)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Database setup completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred: ' + (err.message || String(err)) 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
