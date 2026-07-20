import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect, Path } from 'react-native-svg';
import { useAuth } from '../src/auth/AuthContext';
import { SHOW_DEV_LOGIN } from '../src/auth/config';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useReducedMotion } from '../src/hooks/useReducedMotion';
import { spacing, corner, typography, colors, shadow } from '../src/constants/theme';
import { AchievementGlyph } from '../src/components/ui';

/** Official four-colour Google "G" mark, drawn as inline SVG so it stays
 *  crisp at any size and matches the brand-accurate colours. */
function GoogleG({ size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function LoginScreen({ navigation }) {
  const { session, signingIn, signInReady, signInWithGoogle } = useAuth();
  const c = useThemeColors();
  const reduced = useReducedMotion();

  // Navigation is reactive to session state: promptAsync resolves before the
  // Supabase token exchange completes, so we wait for the session to appear.
  useEffect(() => {
    if (session) {
      navigation.replace('Index');
    }
  }, [session, navigation]);

  // ── Entrance choreography (respects OS reduced-motion) ──────────
  const logoOpacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const titleOpacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const titleTranslate = useRef(new Animated.Value(reduced ? 0 : 14)).current;
  const subOpacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const buttonScale = useRef(new Animated.Value(reduced ? 1 : 0.96)).current;

  useEffect(() => {
    if (reduced) return;
    const ease = Easing.out(Easing.ease);
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 520, delay: 0, easing: ease, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 480, delay: 120, easing: ease, useNativeDriver: true }),
      Animated.timing(titleTranslate, { toValue: 0, duration: 480, delay: 120, easing: ease, useNativeDriver: true }),
      Animated.timing(subOpacity, { toValue: 1, duration: 480, delay: 220, easing: ease, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, tension: 200, friction: 20, delay: 300, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const handleSkipLogin = () => navigation.replace('Index');
  const openUrl = (url) => Linking.openURL(url).catch(() => {});

  const logoTint = c.isDark ? 'rgba(45,212,191,0.16)' : 'rgba(20,184,166,0.12)';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {/* Subtle teal radial glow behind the hero — brand accent at very low opacity. */}
      <Svg
        style={[StyleSheet.absoluteFill, styles.glow]}
        width="100%"
        height="100%"
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="heroGlow" cx="50%" cy="30%" r="58%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={c.isDark ? 0.18 : 0.14} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
      </Svg>

      <View style={styles.content}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Animated.View
            style={[styles.logoBadge, { backgroundColor: logoTint, opacity: logoOpacity }, shadow.soft]}
            accessibilityLabel="TheAnchor logo"
            accessibilityRole="image"
          >
            <AchievementGlyph name="anchor" size={36} color={c.accent} strokeWidth={1.8} />
          </Animated.View>

          <Animated.View
            style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }}
          >
            <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
              Stay anchored to what matters
            </Text>
          </Animated.View>

          <Animated.Text style={[styles.subtitle, { color: c.textMuted, opacity: subOpacity }]}>
            One calm place to build lasting consistency. Your progress stays private, and sign-in is secure.
          </Animated.Text>

          <Animated.View style={[styles.buttonWrap, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity
              style={[
                styles.googleButton,
                { backgroundColor: c.surface, borderColor: c.hairline },
                (!signInReady || signingIn) && styles.googleButtonDisabled,
              ]}
              onPress={signingIn ? null : signInWithGoogle}
              activeOpacity={signingIn ? 1 : 0.85}
              disabled={!signInReady || signingIn}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityHint="Sign in to your TheAnchor account"
              accessibilityState={{ busy: signingIn, disabled: !signInReady || signingIn }}
            >
              {signingIn ? (
                <ActivityIndicator color={c.textMuted} size="small" />
              ) : (
                <>
                  <GoogleG size={20} />
                  <Text style={[styles.googleButtonText, { color: c.text }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.trustRow}>
            <FontAwesome5 name="lock" size={13} color={c.textMuted} style={styles.trustIcon} />
            <Text
              style={[styles.trustText, { color: c.textMuted }]}
              accessibilityLabel="Secure authentication powered by Google"
            >
              Secure authentication, powered by Google
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* ── Footer (legal) — pinned near bottom ──────────────── */}
        <View style={styles.footer}>
          <Text style={[styles.legalText, { color: c.textMuted }]}>
            By continuing you agree to our{' '}
            <Text
              style={[styles.legalLink, { color: c.accent }]}
              accessibilityRole="link"
              onPress={() => openUrl('https://theanchor.app/terms')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={[styles.legalLink, { color: c.accent }]}
              accessibilityRole="link"
              onPress={() => openUrl('https://theanchor.app/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>

          {/* Dev-only skip login — gated by a dedicated dev flag so it can
              never appear in a production build. */}
          {SHOW_DEV_LOGIN && (
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleSkipLogin}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Skip login (development only)"
            >
              <Text style={[styles.devButtonText, { color: c.textMuted }]}>Skip login (dev)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    // sits behind the content; color comes from the SVG itself
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    paddingTop: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: corner.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  buttonWrap: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    width: '100%',
    height: 58,
    borderRadius: corner.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadow.soft,
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleButtonText: {
    ...typography.headingSm,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  trustIcon: {
    marginRight: spacing.xs,
  },
  trustText: {
    ...typography.small,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  legalText: {
    ...typography.small,
    textAlign: 'center',
    maxWidth: 320,
  },
  legalLink: {
    ...typography.small,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  devButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  devButtonText: {
    ...typography.small,
    fontWeight: '500',
  },
});
