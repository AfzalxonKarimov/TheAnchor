import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Alert, Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../supabase/client';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  isGoogleConfigured,
} from './config';

// Configure the native Google Sign-In once at module load.
// `webClientId` is required so the returned id_token's `aud` matches the client
// Supabase validates against in its Google provider settings.
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  offlineAccess: false,
});

/**
 * @typedef {{
 *   session: import('@supabase/supabase-js').Session | null;
 *   user: import('@supabase/supabase-js').User | null;
 *   loading: boolean;
 *   signingIn: boolean;
 *   signInReady: boolean;
 *   signInWithGoogle: () => Promise<void>;
 *   signOut: () => Promise<void>;
 * }} AuthContextValue
 */

/** @type {AuthContextValue} */
const defaultContext = {
  session: null,
  user: null,
  loading: true,
  signingIn: false,
  signInReady: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
};

/** @type {import('react').Context<AuthContextValue>} */
const AuthContext = createContext(defaultContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // Seed session on mount and subscribe to auth changes.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Native Google sign-in -> exchange id_token with Supabase.
  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleConfigured()) {
      Alert.alert(
        'Google not configured',
        'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env and enable Google in Supabase.'
      );
      return;
    }
    try {
      setSigningIn(true);
      if (Platform.OS === 'android') {
        // Ensures Google Play Services is available; no-op on iOS.
        await GoogleSignin.hasPlayServices();
      }
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        // User cancelled or no saved credential — not an error.
        setSigningIn(false);
        return;
      }
      const idToken = response.data?.idToken;
      if (!idToken) {
        setSigningIn(false);
        Alert.alert('Sign-in failed', 'No ID token returned from Google.');
        return;
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      setSigningIn(false);
      if (error) {
        Alert.alert('Sign-in failed', error.message);
      }
      // On success, onAuthStateChange updates `session` and screens react.
    } catch (error) {
      setSigningIn(false);
      // SIGN_IN_CANCELLED is the user backing out — not an error worth surfacing.
      if (error?.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Sign-in failed', error?.message || 'Something went wrong.');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    // Sign out of both Google and Supabase.
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore if not signed in to Google
    }
    await supabase.auth.signOut();
    // onAuthStateChange sets session to null.
  }, []);

  /** @type {AuthContextValue} */
  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signingIn,
    // Native Google Sign-In is ready whenever the client ID is configured.
    signInReady: isGoogleConfigured(),
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
