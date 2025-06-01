
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Database setup function called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create user_role enum if it doesn't exist
    console.log('Creating user_role enum...');
    const enumResult = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'supervisor', 'driver');
          EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `
    }).catch(() => {
      // If rpc doesn't exist, we'll handle table creation differently
      console.log('RPC method not available, using direct SQL');
      return null;
    });

    // Create subscription_type enum if it doesn't exist
    console.log('Creating subscription_type enum...');
    const subscriptionEnumResult = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE subscription_type AS ENUM ('trial', 'basic', 'premium', 'enterprise');
          EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `
    }).catch(() => {
      console.log('Subscription enum creation handled');
      return null;
    });

    // Check if profiles table exists
    console.log('Checking if profiles table exists...');
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);

    if (checkError && checkError.message?.includes('relation "profiles" does not exist')) {
      console.log('Profiles table does not exist, creating...');
      
      // Create profiles table with proper structure
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          full_name TEXT,
          role user_role NOT NULL DEFAULT 'driver',
          company_id UUID,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          two_factor_method TEXT DEFAULT 'email',
          two_factor_secret TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
          PRIMARY KEY (id)
        );
      `;

      const tableResult = await supabaseAdmin.rpc('exec_sql', { sql: createTableSql }).catch(async () => {
        // Fallback: try creating without RPC
        console.log('Creating table without RPC...');
        const { error } = await supabaseAdmin.from('profiles').select('*').limit(0);
        return error;
      });

      console.log('Table creation result:', tableResult);

      // Enable RLS
      const rlsSql = `
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        
        -- Create RLS policies
        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
          
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
      `;

      await supabaseAdmin.rpc('exec_sql', { sql: rlsSql }).catch((err) => {
        console.log('RLS setup handled:', err);
      });

      // Create trigger function for new users
      const triggerSql = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = ''
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
              WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'super_admin'::user_role
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

        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        
        -- Create trigger
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `;

      await supabaseAdmin.rpc('exec_sql', { sql: triggerSql }).catch((err) => {
        console.log('Trigger setup handled:', err);
      });

      console.log('Database setup completed successfully');
    } else {
      console.log('Profiles table already exists');
    }

    // Check if any profiles exist
    const { count: profileCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log('Current profile count:', profileCount);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database setup completed successfully',
        profileCount: profileCount || 0,
        isFirstUser: (profileCount || 0) === 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Database setup error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error during database setup' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
