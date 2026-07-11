import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../src/supabase/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const url = Linking.useLinkingURL();

  const handleSendMagicLink = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address');
      return;
    }

    const isValidEmail = email.includes('@') && email.includes('.');
    if (!isValidEmail) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Use custom scheme for dev client deep linking
      // Format: <scheme>://<path> - theanchor://login
      const redirectTo = 'theanchor://login';

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        // Handle rate limiting specifically
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests') || error.status === 429) {
          Alert.alert('Rate Limited', 'Too many login attempts. Please wait a few minutes before trying again.');
        }
        throw error;
      }

      setEmailSent(true);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      if (!error.message?.includes('rate limit') && !error.message?.includes('too many requests') && error.status !== 429) {
        Alert.alert('Login Failed', error.message || 'Please check your email and try again');
      }
    }
  };

  const handleDeepLink = useCallback(async (url) => {
    if (url) {
      console.log('Handling deep link:', url);
      // Supabase magic link URLs have tokens in the hash fragment
      // URL format: theanchor://login#access_token=...&refresh_token=...
      const parsed = Linking.parse(url);

      // Check both fragment (hash) and queryParams for tokens
      let accessToken = null;
      let refreshToken = null;

      // Try fragment first (hash)
      if (parsed.fragment) {
        const fragmentParams = new URLSearchParams(parsed.fragment);
        accessToken = fragmentParams.get('access_token');
        refreshToken = fragmentParams.get('refresh_token');
      }

      // Fallback to query params if not found in fragment
      if (!accessToken && parsed.queryParams) {
        accessToken = parsed.queryParams.access_token;
        refreshToken = parsed.queryParams.refresh_token;
      }

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (data.session) {
          console.log('Session established from magic link');
          // Clear the URL to prevent re-triggering
          Linking.clearInitialURL?.();
          navigation.replace('Index'); // Navigate to TabNavigator
        } else if (error) {
          console.error('Failed to set session:', error);
        }
      }
    }
  }, [navigation]);

  // Handle deep link from magic link redirect and auth state changes
  useEffect(() => {
    handleDeepLink(url);
  }, [url, handleDeepLink]);

  // Dev-only skip login button needs to navigate to Index
  const handleSkipLogin = () => {
    navigation.replace('Index'); // Navigate to TabNavigator
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to TheAnchor</Text>
        <Text style={styles.subtitle}>Sign in with magic link to start building habits</Text>

        {emailSent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✓ Magic link sent!</Text>
            <Text style={styles.successSubtext}>Check your email and tap the link to open in the dev client app.</Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        {!emailSent && (
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={isLoading ? null : handleSendMagicLink}
            activeOpacity={isLoading ? 1 : 0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Send Magic Link</Text>
            )}
          </TouchableOpacity>
        )}

        {emailSent && (
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => {
              setEmailSent(false);
              handleSendMagicLink();
            }}
          >
            <Text style={styles.resendButtonText}>Resend Magic Link</Text>
          </TouchableOpacity>
        )}

        {/* Dev-only skip login button */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#FF3B30', marginTop: 10 }]}
            onPress={handleSkipLogin}
          >
            <Text style={styles.loginButtonText}>Skip Login (Dev)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, padding: 30, paddingTop: 100, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 5, fontSize: 14 },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10
  },
  loginButtonDisabled: {
    opacity: 0.7
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  successContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  successText: { fontSize: 20, fontWeight: 'bold', color: '#34C759', marginBottom: 8 },
  successSubtext: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  resendButton: {
    alignItems: 'center',
    marginTop: 20
  },
  resendButtonText: { color: '#007AFF', fontSize: 14 }
});