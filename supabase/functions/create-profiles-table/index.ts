
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

    // Create the user_role type if it doesn't exist
    console.log('Creating user_role type if not exists')
    try {
      await supabase.auth.admin.executeSql(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE public.user_role AS ENUM (
              'super_admin', 
              'company_admin', 
              'supervisor', 
              'driver'
            );
          END IF;
        END
        $$;
      `)
    } catch (typeErr) {
      console.log('Error checking/creating role type:', typeErr)
      // Continue anyway
    }

    console.log('Creating profiles table if not exists')
    // Create the profiles table if it doesn't exist
    const { error: tableError } = await supabase.auth.admin.executeSql(`
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
    `)
    
    if (tableError) {
      console.error('Error creating profiles table:', tableError)
      return new Response(
        JSON.stringify({ error: 'Failed to create database tables: ' + tableError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
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
    
    if (functionError) {
      console.error('Error creating handle_new_user function:', functionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user handler function: ' + functionError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
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
      return new Response(
        JSON.stringify({ error: 'Failed to create auth trigger: ' + triggerError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
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
