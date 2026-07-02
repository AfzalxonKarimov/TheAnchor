import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');
  const [consistency, setConsistency] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Habit name is required');
      return;
    }
    const consistencyNum = parseInt(consistency, 10);
    if (isNaN(consistencyNum) || consistencyNum < 0 || consistencyNum > 100) {
      Alert.alert('Error', 'Consistency must be a number between 0 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const stored = await AsyncStorage.getItem('@habits');
      const habits = stored ? JSON.parse(stored) : [];

      const newHabit = {
        id: Date.now().toString(),
        name: habitName.trim(),
        consistency: consistencyNum,
      };
      habits.push(newHabit);
      await AsyncStorage.setItem('@habits', JSON.stringify(habits));

      Alert.alert('Success', 'Habit saved!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

      // Haptic feedback
      if (Platform.OS !== 'web' && Haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          console.warn('Haptic feedback failed:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to save habit', e);
    } finally {
      setIsSaving(false);
    }
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
        value={consistency}
        onChangeText={setConsistency}
        placeholder="0-100"
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