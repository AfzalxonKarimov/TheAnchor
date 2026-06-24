import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CheckInScreen({ route, navigation }) {
  const { habit } = route.params;
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinish = () => {
    // Phase 3: save this session length to Supabase, update consistency score
    console.log(`Finished ${habit.name} after ${seconds} seconds`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.habitName}>{habit.name}</Text>
      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      <TouchableOpacity
        style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]}
        onPress={() => setIsRunning(!isRunning)}
      >
        <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Finish Check-In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 80, alignItems: 'center' },
  habitName: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  timer: { fontSize: 64, fontWeight: 'bold', marginBottom: 40 },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 20,
  },
  startButton: { backgroundColor: '#34C759' },
  pauseButton: { backgroundColor: '#FF9500' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  finishButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  finishButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
});