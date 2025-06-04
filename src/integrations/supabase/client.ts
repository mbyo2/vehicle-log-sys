
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyeypbfdtitxqssvnagy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXlwYmZkdGl0eHFzc3ZuYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTI1NTgsImV4cCI6MjA0OTk2ODU1OH0.jKd7rzhCpkF76FIYUAwT7gK3YLaGtUstjM-IJmdY6As';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Test connection on initialization with better error handling
(async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && !error.message?.includes('relation "profiles" does not exist')) {
      console.warn('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection established successfully');
    }
  } catch (err) {
    console.warn('Supabase connection test error:', err);
  }
})();
