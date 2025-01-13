import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yyeypbfdtitxqssvnagy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXlwYmZkdGl0eHFzc3ZuYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0ODQxNzAsImV4cCI6MjAyMzA2MDE3MH0.0oEzKzI2Tz0bmXx_dZLVUrgZvHUbAMxkMrPwVEtVHFQ',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);