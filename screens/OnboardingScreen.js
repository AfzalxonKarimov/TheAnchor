import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';

export default function OnboardingScreen({ navigation }) {
  const { session, loading } = useAuth();

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
      icon: 'line-chart',
    },
  ];

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  // While the initial session check resolves, show a spinner to avoid a flash
  // of the onboarding UI for already-signed-in users.
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>TheAnchor</Text>
        <Text style={styles.tagline}>Built for the days your motivation runs out — not just the days it's high.</Text>

        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <FontAwesome name={feature.icon} size={28} color="#007AFF" style={styles.featureIcon} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  contentContainer: { flex: 1, padding: 30, paddingTop: 100 },
  title: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  tagline: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, fontStyle: 'italic' },
  featureList: { gap: 20 },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: { marginRight: 16 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  featureDescription: { fontSize: 15, color: '#666' },
  buttonContainer: { padding: 30 },
  getStartedButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});