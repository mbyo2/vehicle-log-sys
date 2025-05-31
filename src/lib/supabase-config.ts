
// Centralized Supabase configuration
export const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    functionsUrl: `${supabaseUrl}/functions/v1`
  };
};
