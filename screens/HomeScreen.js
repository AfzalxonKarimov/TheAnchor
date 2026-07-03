import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

import {
  getLevelFromXP,
  getRankFromLevel,
} from '../lib/leveling';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState([]);
  const [xp, setXp] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);

  // Load XP from AsyncStorage
  const loadXP = useCallback(async () => {
    try {
      const storedXP = await AsyncStorage.getItem('@xp');
      if (storedXP) {
        setXp(parseInt(storedXP, 10));
      } else {
        setXp(0);
      }
    } catch (e) {
      console.warn('Failed to load XP from AsyncStorage', e);
      setXp(0);
    }
  }, []);

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
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadXP(), loadHabits()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadXP, loadHabits]);

  // Leveling calculations
  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

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
    if (!isLoading && habits.length === 0) {
      navigation.navigate('AddHabit');
    }
  }, [habits, navigation, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Today's Anchors</Text>
          <Text style={styles.statValue}>{habits.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Momentum</Text>
          <Text style={styles.statValue}>3 days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{xp}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Level</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rank</Text>
          <Text style={styles.statValue}>{rank}</Text>
        </View>
      </View>

      <Text style={styles.title}>Your Habits</Text>

      {habits.length > 0 ? (
        <>
          <Text style={styles.subtitle}>You have {habits.length} habit{habits.length !== 1 ? 's' : ''} tracked</Text>

          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.habitCard}
                onPress={() => navigation.navigate('CheckIn', { habit: item })}
              >
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{item.name}</Text>
                  <Text style={styles.habitDescription}>{item.description}</Text>
                </View>
                <View style={styles.habitStats}>
                  <Text style={styles.habitScore}>{item.consistency || 0}%</Text>
                  {celebrate && (
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      <FontAwesome name="star" size={20} color="#FFD700" />
                    </Animated.View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Has Anchors? -- No &gt; Create First Anchor</Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddHabit')}>
        <Text style={styles.addButtonText}>+ Add Anchor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },

  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, marginTop: 10 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, color: '#555', textAlign: 'center', paddingHorizontal: 20 },

  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '600' },
  habitDescription: { fontSize: 12, color: '#666', marginTop: 4 },
  habitStats: { alignItems: 'flex-end' },
  habitScore: { fontSize: 14, color: '#007AFF', fontWeight: 'bold' },

  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Progress bar styles
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
});