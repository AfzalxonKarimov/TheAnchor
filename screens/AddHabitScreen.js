import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function AddHabitScreen({ navigation }) {
  const [habitName, setHabitName] = useState('');

  const handleSave = () => {
    // Phase 3: save this to Supabase instead of just logging it
    console.log('New habit:', habitName);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Habit</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Workout, Read, Meditate"
        value={habitName}
        onChangeText={setHabitName}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
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
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});