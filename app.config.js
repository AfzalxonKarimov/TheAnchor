// Use EXPO_PUBLIC_ prefixed env vars (required for Expo SDK 54+ client access)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

module.exports = {
  expo: {
    name: 'theanchor',
    slug: 'theanchor',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: 'theanchor',
    plugins: ['expo-font'],
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.afzalto.theanchor',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.afzalto.theanchor',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      eas: {
        projectId: 'b33f477a-a053-4f13-bfda-bb22b7db0f39',
      },
    },
  },
};