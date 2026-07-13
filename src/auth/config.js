// Google OAuth client IDs, read from Expo public env vars (EXPO_PUBLIC_* required in SDK 54).
//
// For the Supabase id-token flow, the WEB client ID is the one Supabase validates the
// token's `aud` against, so it must match the "Web client ID" configured in
// Supabase Dashboard -> Auth -> Providers -> Google.
//
// iOS/Android client IDs are optional but recommended for native builds so the
// native Google sign-in sheet is used. Leave them unset to fall back to the web client.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID';
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined;

// True when a real web client ID has been provided (not the placeholder).
export const isGoogleConfigured = () =>
  GOOGLE_WEB_CLIENT_ID !== 'YOUR_GOOGLE_WEB_CLIENT_ID';
