import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Haptics } from 'expo';

// Import icons (assuming you have them) or use font icons
import { FontAwesome } from '@expo/vector-icons';

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [animations] = useState(new Animated.Value(0));

  const features = [
    {
      title: 'Track Your Habits',
      description: 'Add daily habits and track your consistency over time',
      icon: FontAwesome.Tags,
    },
    {
      title: 'Earn XP',
      description: 'Complete check-ins to earn experience and level up',
      icon: FontAwesome.Star,
    },
    {
      title: 'Reach New Ranks',
      description: 'Unlock achievements as you progress through levels',
      icon: FontAwesome.Crown,
    },
  ];

  // Calculate animation for step progress
  const interpolateStep = animations.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  })
  animations.interpolate({
    inputRange: [0, 3], // 3 steps
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const handleStepChange = (step) => {
    setCurrentStep(step);
    animations.setValue(step);
  };

  const handleGetStarted = () => {
    // Animation to full screen
    Animated.timing(animations, {
      toValue: 3,
      duration: 500,
      useNativeDriver: true,
      timingFunction: Easing.linear
    }).start(() => {
      navigation.replace('Home');
      // Have user react to completion
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Habit Tracker</Text>
        <Text style={styles.subtitle}>Level up your daily routine!</Text>

        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureCard,
                { opacity: interpolateStep(index + 1) } // Fade in effect
              ]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          disabled={currentStep < 2} // Block until last step
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
  subtitle: { fontSize: 18, color: '#555', textAlign: 'center', marginBottom: 40 },
  featureList: { gap: 20 },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: { fontSize: 28, marginRight: 16 },
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