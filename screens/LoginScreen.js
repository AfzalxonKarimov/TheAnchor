import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';

export default function LoginScreen({ navigation }) {
  const { session, signingIn, signInReady, signInWithGoogle } = useAuth();

  // Navigation is reactive to session state: promptAsync resolves before the
  // Supabase token exchange completes, so we wait for the session to appear.
  useEffect(() => {
    if (session) {
      navigation.replace('Index');
    }
  }, [session, navigation]);

  // Dev-only skip login button (bypasses auth for local testing).
  const handleSkipLogin = () => {
    navigation.replace('Index');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to TheAnchor</Text>
        <Text style={styles.subtitle}>
          Sign in with Google to start building habits
        </Text>

        <TouchableOpacity
          style={[
            styles.googleButton,
            (!signInReady || signingIn) && styles.googleButtonDisabled,
          ]}
          onPress={signingIn ? null : signInWithGoogle}
          activeOpacity={signingIn ? 1 : 0.7}
          disabled={!signInReady || signingIn}
        >
          {signingIn ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <FontAwesome
                name="google"
                size={20}
                color="#fff"
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Dev-only skip login button */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.googleButton, styles.devButton]}
            onPress={handleSkipLogin}
          >
            <Text style={styles.googleButtonText}>Skip Login (Dev)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 100,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  googleButtonDisabled: { opacity: 0.7 },
  googleIcon: { marginRight: 10 },
  googleButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  devButton: { backgroundColor: '#FF3B30' },
});
