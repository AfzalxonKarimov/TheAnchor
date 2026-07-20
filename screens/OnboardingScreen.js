import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth/AuthContext';
import { useThemeColors } from '../src/theme/useThemeColors';
import { spacing, corner, typography } from '../src/constants/theme';
import { Reveal } from '../src/components/ui';

export default function OnboardingScreen({ navigation }) {
  const { session, loading } = useAuth();
  const c = useThemeColors();

  // Auto-redirect already-authenticated users to the app.
  useEffect(() => {
    if (!loading && session) {
      navigation.replace('Index'); // Navigate to TabNavigator
    }
  }, [loading, session, navigation]);

  // Springy scale feedback for the CTA press (0.98 on press, back to 1 on release).
  const buttonScale = useRef(new Animated.Value(1)).current;
  const animateScale = (toValue) =>
    Animated.spring(buttonScale, {
      toValue,
      tension: 320,
      friction: 22,
      useNativeDriver: true,
    }).start();

  const features = [
    {
      title: 'Build Anchors',
      description: 'Daily routines that keep you moving.',
      icon: 'anchor',
    },
    {
      title: 'Earn XP & Level Up',
      description: 'Every session makes you stronger.',
      icon: 'star',
    },
    {
      title: 'Track Momentum',
      description: 'Progress never falls back to zero.',
      icon: 'chart-line',
    },
  ];

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  // Calm ease-out used across the entrance sequence (250–400ms per the brief).
  const easeOut = Easing.out(Easing.ease);

  // While the initial session check resolves, show a spinner to avoid a flash
  // of the onboarding UI for already-signed-in users.
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer, { backgroundColor: c.background }]}
      >
        <ActivityIndicator size="large" color={c.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <Reveal delay={0} distance={8} easing={easeOut} duration={320}>
          <Text style={[styles.logo, { color: c.text }]}>TheAnchor</Text>
        </Reveal>

        <Reveal delay={120} distance={24} easing={easeOut} duration={340}>
          <Text style={[styles.headline, { color: c.text }]}>
            {'Stay consistent.\nEven when motivation disappears.'}
          </Text>
        </Reveal>

        <Reveal delay={200} distance={16} easing={easeOut} duration={340}>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Built for the days motivation disappears—not just the days it's easy.
          </Text>
        </Reveal>

        {/* ── Feature cards ────────────────────────────────────── */}
        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              colors={c}
              delay={320 + index * 90}
              easing={easeOut}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Footer: page indicator + CTA ──────────────────────── */}
      <View
        style={[
          styles.footer,
          { paddingBottom: spacing.lg, borderTopColor: c.hairline },
        ]}
      >
        <Reveal delay={560} distance={12} easing={easeOut} duration={300}>
          <PageDots colors={c} />
        </Reveal>

        <Reveal delay={640} distance={20} easing={easeOut} duration={340}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              accessible
              accessibilityRole="button"
              accessibilityLabel="Begin my journey"
              style={[styles.getStartedButton, { backgroundColor: c.accent }]}
              activeOpacity={0.9}
              onPressIn={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                animateScale(0.98);
              }}
              onPressOut={() => animateScale(1)}
              onPress={handleGetStarted}
            >
              <Text style={[styles.buttonText, { color: c.onAccent }]}>
                Begin My Journey
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Reveal>
      </View>
    </SafeAreaView>
  );
}

/** Single feature card — extracted so the three cards share one UI. */
function FeatureCard({ feature, colors, delay, easing }) {
  return (
    <Reveal delay={delay} distance={20} easing={easing} duration={340}>
      <View
        style={[
          styles.featureCard,
          { backgroundColor: colors.surface, borderColor: colors.hairline },
        ]}
      >
        <View
          style={[
            styles.featureIconWrap,
            { backgroundColor: `${colors.accent}1F` },
          ]}
        >
          <FontAwesome5 name={feature.icon} size={26} color={colors.accent} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>
            {feature.title}
          </Text>
          <Text style={[styles.featureDescription, { color: colors.textMuted }]}>
            {feature.description}
          </Text>
        </View>
      </View>
    </Reveal>
  );
}

/** Minimal centered page indicator (first of three pages is active). */
function PageDots({ colors }) {
  return (
    <View style={styles.pager} pointerEvents="none">
      {[true, false, false].map((active, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: active
                ? colors.accent
                : colors.isDark
                ? 'rgba(255,255,255,0.16)'
                : 'rgba(0,0,0,0.14)',
              width: active ? 22 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },

  // ── Hero typography ──────────────────────────────────────────
  logo: {
    ...typography.displayMd, // 40 / 700 — bold, calm
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800', // ExtraBold
    lineHeight: 39,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500', // Medium
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },

  // ── Feature cards ────────────────────────────────────────────
  featureList: { gap: spacing.lg },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: corner.lg, // 24 — softer, premium surface
    padding: spacing.lg, // 24 — roomy interior
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 60, // larger soft-squared icon container
    height: 60,
    borderRadius: corner.md, // 18 — softer than a full circle
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTextContainer: { flex: 1 },
  featureTitle: { ...typography.headingLg, marginBottom: spacing.xs }, // 22 / 600
  featureDescription: { ...typography.bodyMd, lineHeight: 22 }, // 15 / 400

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  getStartedButton: {
    height: 58, // comfortable ≥44pt touch target
    borderRadius: corner.md, // 18 — premium radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
