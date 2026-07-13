import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../src/supabase/client';
import { calculateCheckInXP } from '../lib/leveling.js';
import { updateMomentum } from '../lib/momentum.js';
import { getStreak } from '../src/supabase/streaks.js';

export default function CheckInScreen({ route, navigation }) {
  const { habit } = route.params;
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinish = async () => {
    if (seconds === 0) {
      Alert.alert('Error', 'Session must be at least 1 second');
      return;
    }

    setIsSaving(true);
    try {
      const xpEarned = calculateCheckInXP(seconds);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Save session to Supabase
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          anchor_id: habit.id,
          user_id: user.id,
          duration_seconds: seconds,
          xp: xpEarned,
        });

      if (sessionError) throw sessionError;

      // Update user's XP and momentum in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single();

      if (profile) {
        const newTotalXP = (profile.total_xp || 0) + xpEarned;
        // Get current streak for momentum calculation
        const streak = await getStreak();
        // Update momentum
        await updateMomentum({
          userId: user.id,
          xpEarned,
          durationSeconds: seconds,
          streak,
        });
        await supabase
          .from('profiles')
          .update({ total_xp: newTotalXP })
          .eq('id', user.id);
      }

      console.log(`Finished ${habit.title} after ${seconds} seconds — earned ${xpEarned} XP`);

      Alert.alert('Session Complete!', `+${xpEarned} XP earned`, [
        { text: 'Nice', onPress: () => navigation.goBack() }
      ]);

      setIsRunning(false);
      setSeconds(0);
    } catch (e) {
      console.error('Failed to save session', e);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.habitName}>{habit.title || habit.name}</Text>
      <Text style={styles.timer}>{formatTime(seconds)}</Text>

      <TouchableOpacity
        style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]}
        onPress={() => setIsRunning(!isRunning)}
      >
        <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.finishButton, (seconds === 0 || isSaving) && styles.finishButtonDisabled]}
        onPress={seconds > 0 && !isSaving ? handleFinish : undefined}
        activeOpacity={seconds > 0 && !isSaving ? 0.7 : 1}
      >
        <Text style={styles.finishButtonText}>
          {isSaving ? 'Saving...' : 'Finish Session'}
        </Text>
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
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
});