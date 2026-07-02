import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

import {
  getLevelFromXP,
  getRankFromLevel,
  getLevelProgress,
  getXPForNextLevel,
} from '../lib/leveling';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState([]);
  const [celebrate, setCelebrate] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Load habits from AsyncStorage on mount
  const loadHabits = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@habits');
      if (stored) {
        setHabits(JSON.parse(stored));
      } else {
        setHabits([]);
      }
    } catch (e) {
      console.warn('Failed to load habits from AsyncStorage', e);
      setHabits([]);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Leveling calculations
  const level = getLevelFromXP(320);
  const rank = getRankFromLevel(level);
  const progress = getLevelProgress(320);
  const nextLevelXP = getXPForNextLevel(320);
  const xpToNext = nextLevelXP - 320;

  // Celebration animation
  useEffect(() => {
    if (rank !== 'Spark') {
      setCelebrate(true);
    }
  }, [rank]);

  useEffect(() => {
    if (celebrate) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setCelebrate(false));
    }
  }, [celebrate, scaleAnim]);

  // Auto-navigate to AddHabit if no habits exist
  useEffect(() => {
    if (habits.length === 0) {
      navigation.navigate('AddHabit');
    }
  }, [habits, navigation]);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Habits</Text>

      {habits.length > 0 ? (
        <>
          <Text style={styles.subtitle}>You have {habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</Text>

          <View style={styles.featureList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <FlatList
            data={habits}
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
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Create your first habit below!</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddHabit')}>
        <Text style={styles.addButtonText}>+ Add Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },

  featureList: { marginBottom: 20 },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: { fontSize: 28, marginRight: 16 },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  featureDescription: { fontSize: 15, color: '#666' },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center' },

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

  addButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});