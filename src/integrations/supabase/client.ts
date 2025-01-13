import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyeypbfdtitxqssvnagy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZXlwYmZkdGl0eHFzc3ZuYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDMzMzg5ODAsImV4cCI6MjAxODkxNDk4MH0.qDj5QkyAI45zBbAJxIcnSxsZbc7UJ6ZwH4pGBME_9KE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});