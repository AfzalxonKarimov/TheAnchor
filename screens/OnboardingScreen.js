import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TheAnchor</Text>
      <Text style={styles.subtitle}>
        Built for the days your motivation runs out — not just the days it's high.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  title: { fontSize: 40, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 40 },
  button: { backgroundColor: '#007AFF', paddingVertical: 16, paddingHorizontal: 50, borderRadius: 50 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});