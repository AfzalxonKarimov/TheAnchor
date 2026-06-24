import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

// Fake placeholder data for now — Phase 3 will replace this with real Supabase data
const DUMMY_HABITS = [
  { id: '1', name: 'Workout', consistency: 80 },
  { id: '2', name: 'Read 20 pages', consistency: 45 },
  { id: '3', name: 'No phone after 10pm', consistency: 60 },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Habits</Text>

      <FlatList
        data={DUMMY_HABITS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.habitCard}
            onPress={() => navigation.navigate('CheckIn', { habit: item })}
          >
            <Text style={styles.habitName}>{item.name}</Text>
            <Text style={styles.habitScore}>{item.consistency}%</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddHabit')}
      >
        <Text style={styles.addButtonText}>+ Add Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginBottom: 12,
  },
  habitName: { fontSize: 16, fontWeight: '600' },
  habitScore: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});