import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yyeypbfdtitxqssvnagy.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);