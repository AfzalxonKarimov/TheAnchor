import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../src/supabase/client';

export default function OnboardingScreen({ navigation }) {
  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // In production, redirect if already signed in
      // In dev, don't auto-redirect
      if (session && !__DEV__) {
        navigation.replace('Index'); // Navigate to TabNavigator
      }
    };

    checkAuth();

    // Listen for auth state changes (disabled in dev to prevent skipping)
    if (!__DEV__) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigation.replace('Index'); // Navigate to TabNavigator
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe?.();
      };
    }
  }, [navigation]);

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