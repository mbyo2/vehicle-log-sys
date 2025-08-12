
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
    db: {
      schema: 'public'
    }
  }
);

// Test connection with better error handling
let connectionTested = false;

const testConnection = async () => {
  if (connectionTested) return;
  connectionTested = true;
  
  try {
    const { error } = await supabase.auth.getSession();
    
    if (error && !error.message?.includes('JWT')) {
      console.warn('Supabase auth connection test failed:', error);
    } else {
      console.log('Supabase connection established successfully');
    }
  } catch (err) {
    console.warn('Supabase connection test error:', err);
  }
};

// Only test connection in browser environment
if (typeof window !== 'undefined') {
  testConnection();
}
