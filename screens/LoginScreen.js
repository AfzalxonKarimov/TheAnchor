import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../src/supabase/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
      // For Expo Go, use the expo:// scheme with your dev server address
      // Format: exp://<host>:<port>/<path> - allows Expo Go to handle the auth callback
      const redirectTo = 'exp://localhost:8081/--/login';

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

  const handleCheckAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigation.replace('Index'); // Navigate to TabNavigator
    }
  };

  // Auto-check auth on mount
  React.useEffect(() => {
    handleCheckAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigation.replace('Index'); // Navigate to TabNavigator
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, [navigation]);

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
            <Text style={styles.successSubtext}>Check your email. On mobile, tap the link to open in Expo Go. On simulator, open the link in your computer's browser.</Text>
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