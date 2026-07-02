import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { calculateCheckInXP } from '../lib/leveling';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckInScreen({ route, navigation }) {
  const { habit } = route.params;
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  // Load current total XP on mount
  useEffect(() => {
    loadTotalXP();
  }, []);

  // Timer interval for tracking check-in duration
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const loadTotalXP = async () => {
    try {
      const value = await AsyncStorage.getItem('@totalXP');
      const currentXP = value ? parseInt(value, 10) : 0;
      setTotalXP(currentXP);
    } catch (e) {
      console.warn('Failed to load XP', e);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinish = async () => {
    const xpEarned = calculateCheckInXP(seconds);
    const newTotal = totalXP + xpEarned;

    try {
      // Save new XP to AsyncStorage
      await AsyncStorage.setItem('@totalXP', newTotal.toString());
      setTotalXP(newTotal);

      console.log(`Finished ${habit.name} after ${seconds} seconds — earned ${xpEarned} XP`);

      Alert.alert('Quest Complete!', `+${xpEarned} XP earned`, [
        { text: 'Nice', onPress: () => navigation.goBack() }
      ]);

      setIsRunning(false);
      setSeconds(0);
    } catch (e) {
      console.error('Failed to save XP', e);
    }
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