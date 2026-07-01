import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Haptics } from 'expo'; // Assuming expo is available

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');
  const [consistency, setConsistency] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    // Validation
    if (!habitName.trim()) {
      Alert.alert('Error', 'Habit name is required');
      return;
    }
    const consistencyNum = parseInt(consistency, 10);
    if (isNaN(consistencyNum) || consistencyNum < 0 || consistencyNum > 100) {
      Alert.alert('Error', 'Please enter a consistency percentage between 0 and 100');
      return;
    }

    setIsSaving(true);
    // Simulate async save (replace with actual Supabase call in real app, replace with Supabase call
    setTimeout(() => {
      // Phase 3: save this to Supabase instead of just logging it
      console.log('New habit:', { name: habitName.trim(), consistency: consistencyNum });
      // Haptic feedback success
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Habit saved!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setIsSaving(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Habit</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Workout, Read, Meditate"
        value={habitName}
        onChangeText={setHabitName}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Consistency Goal (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0-100"
        value={consistency}
        onChangeText={setConsistency}
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
        onPress={isSaving ? null : handleSave}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : 'Save Habit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});