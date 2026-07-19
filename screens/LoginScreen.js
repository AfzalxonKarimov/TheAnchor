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
import { useThemeColors } from '../src/theme/useThemeColors';
import { spacing } from '../src/constants/theme';

export default function LoginScreen({ navigation }) {
  const { session, signingIn, signInReady, signInWithGoogle } = useAuth();
  const c = useThemeColors();

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
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: c.text }]}>Welcome to TheAnchor</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
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

        {/* Dev-only skip login — kept intentionally low-prominence so it never
            competes with the real auth CTA. Invisible in production (__DEV__). */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devButton}
            onPress={handleSkipLogin}
            activeOpacity={0.6}
          >
            <Text style={[styles.devButtonText, { color: c.textMuted }]}>Skip login (dev)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    flex: 1,
    padding: spacing.xl,
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
  devButton: {
    marginTop: 28,
    paddingVertical: 8,
    alignItems: 'center',
  },
  devButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
});
