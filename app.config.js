// Use EXPO_PUBLIC_ prefixed env vars (required for Expo SDK 54+ client access)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || null;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || null;

// Google Sign-In plugin (non-Firebase) requires BOTH iOS and Android client IDs
// because it needs a valid iosUrlScheme in format "com.googleusercontent.apps.<client-id-prefix>"
const HAS_GOOGLE_NATIVE_SIGNIN = GOOGLE_IOS_CLIENT_ID && GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_URL_SCHEME = HAS_GOOGLE_NATIVE_SIGNIN
  ? `com.googleusercontent.apps.${GOOGLE_IOS_CLIENT_ID.split('.')[0]}`
  : undefined;

module.exports = {
  expo: {
    name: 'theanchor',
    slug: 'theanchor',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: 'theanchor',
    plugins: [
      'expo-font',
      'expo-app-icon',
      // Google native sign-in. The plugin registers the iOS URL scheme and
      // passes the Android client ID so the native module is configured correctly.
      // Only enabled when BOTH iOS and Android client IDs are configured (non-Firebase
      // version requires iosUrlScheme in format "com.googleusercontent.apps.<prefix>").
      ...(HAS_GOOGLE_NATIVE_SIGNIN
        ? [
            [
              '@react-native-google-signin/google-signin',
              {
                iosUrlScheme: GOOGLE_IOS_URL_SCHEME,
                androidClientId: GOOGLE_ANDROID_CLIENT_ID,
              },
            ],
          ]
        : []),
    ],
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
      // Prevent multiple root-component instances on cold-start/deep-link, which
      // React Navigation reports as "linking configured in multiple places".
      launchMode: 'singleTask',
      package: 'com.afzalto.theanchor',
      versionCode: 2,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      googleClientId: GOOGLE_CLIENT_ID,
      eas: {
        projectId: 'b33f477a-a053-4f13-bfda-bb22b7db0f39',
      },
    },
  },
};