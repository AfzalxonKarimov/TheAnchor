import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from Expo public env vars (EXPO_PUBLIC_* prefix required in SDK 54)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Validate that we have real credentials (not placeholders)
const isConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable auto-refresh of tokens
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session from URL (for magic link redirects)
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = () => isConfigured;

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};