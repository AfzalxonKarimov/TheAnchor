import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';
import { useThemeColors } from '../src/theme/useThemeColors';
import { spacing, colors, typography } from '../src/constants/theme';

export default function OnboardingScreen({ navigation }) {
  const { session, loading } = useAuth();
  const c = useThemeColors();

  // Auto-redirect already-authenticated users to the app.
  useEffect(() => {
    if (!loading && session) {
      navigation.replace('Index'); // Navigate to TabNavigator
    }
  }, [loading, session, navigation]);

  const features = [
    {
      title: 'Build Anchors',
      description: 'Create daily routines that keep you grounded when motivation dips',
      icon: 'anchor',
    },
    {
      title: 'Earn XP & Level Up',
      description: 'Complete sessions to earn experience and unlock new ranks',
      icon: 'star',
    },
    {
      title: 'Track Momentum',
      description: 'See your progress grow with Momentum that never resets to zero',
      icon: 'chart-line',
    },
  ];

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  // While the initial session check resolves, show a spinner to avoid a flash
  // of the onboarding UI for already-signed-in users.
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: c.text }]}>TheAnchor</Text>
        <Text style={[styles.tagline, { color: c.textMuted }]}>
          Built for the days your motivation runs out — not just the days it's high.
        </Text>

        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: c.surfaceAlt, borderColor: c.hairline }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: `${c.accent}1F` }]}>
                <FontAwesome5 name={feature.icon} size={24} color={c.accent} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: c.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: c.textMuted }]}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: c.accent }]}
          onPress={handleGetStarted}
        >
          <Text style={[styles.buttonText, { color: c.onAccent }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  contentContainer: { flex: 1, padding: spacing.xl, paddingTop: 100 },
  title: { ...typography.displayXs, textAlign: 'center', marginBottom: 10 },
  tagline: { ...typography.body, textAlign: 'center', marginBottom: 40, fontStyle: 'italic' },
  featureList: { gap: 20 },
  featureCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  featureIcon: { marginRight: 16 },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: { flex: 1 },
  featureTitle: { ...typography.headingSm, marginBottom: 4 },
  featureDescription: { ...typography.bodyMd },
  buttonContainer: { padding: spacing.xl },
  getStartedButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { ...typography.body, fontWeight: 'bold' },
});
