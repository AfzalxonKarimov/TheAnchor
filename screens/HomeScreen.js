import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../src/supabase/client';

import {
  getLevelFromXP,
  getRankFromLevel,
} from '../lib/leveling';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState([]);
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [celebrate, setCelebrate] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data from Supabase
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // In development, allow use without auth (for testing)
      // In production, redirect to onboarding if no user
      if (!user && !__DEV__) {
        navigation.replace('Onboarding');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, momentum')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Failed to load profile:', error);
      }

      if (data) {
        setXp(data.total_xp || 0);
        setMomentum(data.momentum || 50);
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
  }, [navigation]);

  // Load anchors from Supabase
  const loadHabits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('anchors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load anchors:', error);
        setHabits([]);
        return;
      }

      setHabits(data || []);
    } catch (e) {
      console.warn('Failed to load anchors from Supabase', e);
      setHabits([]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Skip profile loading in dev mode (no auth required)
      if (__DEV__) {
        setXp(100);
        setMomentum(50);
      }
      await loadHabits();
      setIsLoading(false);
    };
    loadData();
  }, [loadProfile, loadHabits]);

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

  // Auto-navigate to Journey if no habits exist
  useEffect(() => {
    if (!isLoading && habits.length === 0) {
      navigation.navigate('journey');
    }
  }, [habits, navigation, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Onboarding');
  };

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
        <View style={styles.headerTop}>
          <Text style={styles.title}>TheAnchor</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today's Anchors</Text>
            <Text style={styles.statValue}>{habits.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Momentum</Text>
            <Text style={styles.statValue}>{momentum} pts</Text>
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
      </View>

      <Text style={styles.sectionTitle}>Your Anchors</Text>

      {habits.length > 0 ? (
        <>
          <Text style={styles.subtitle}>You have {habits.length} anchor{habits.length !== 1 ? 's' : ''} tracked</Text>

          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.habitCard}
                onPress={() => navigation.navigate('CheckIn', { habit: item })}
              >
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{item.title}</Text>
                  <Text style={styles.habitDescription}>
                    Target: {item.target_days || 7} days • Min: {item.minimum_duration || 15} min
                  </Text>
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
          <Text style={styles.emptyText}>Create your first Anchor to begin tracking</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutText: { color: '#007AFF', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    minWidth: '48%',
    paddingVertical: 8,
    marginBottom: 8,
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

  sectionTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, marginTop: 10 },
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
});