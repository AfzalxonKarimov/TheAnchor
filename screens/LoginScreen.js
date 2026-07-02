import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function LoginScreen({ navigation }) {
  const handleSendLink = () => {
    // TODO: Integrate with Supabase magic link
    // For now just simulate navigation
    setTimeout(() => {
      navigation.replace('Home');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TheAnchor</Text>
      <Text style={styles.subtitle}>We'll send you a login link via email</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <Text style={styles.input}>[your.email@example.com]</Text>
      </View>

      <Button
        title="Send Magic Link"
        onPress={handleSendLink}
        color="#007AFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputContainer: { marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 5 },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  }
});