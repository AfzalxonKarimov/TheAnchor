import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase/client';

import {
  getLevelFromXP,
  getRankFromLevel,
} from '../lib/leveling';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';
import { getTodaySessions } from '../src/supabase/sessions';

// Identity lines keyed by rank
const IDENTITY_LINES: Record<string, string> = {
  Spark: 'You\'re becoming someone who shows up.',
  Ember: 'Your consistency is building momentum.',
  Flame: 'You\'re igniting lasting change.',
  Anchor: 'You are grounded in your practice.',
  Forged: 'You\'ve forged unbreakable habits.',
  Diamond: 'You exemplify mastery and resilience.',
};

/**
 * Home Screen (Dashboard) - Daily anchor overview.
 *
 * Design decisions:
 * - Clean header with welcome message and rank badge
 * - Stats row showing Momentum, XP, Level
 * - Identity line based on current rank
 * - Anchor list showing all anchors with complete/incomplete state for today
 * - Floating button in tab bar for check-in initiation (auto-starts or shows picker)
 */
export default function HomeScreen() {
  const [habits, setHabits] = useState<Anchor[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Load profile data from Supabase
  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user && !__DEV__) {
        // Will be handled by navigation root in production
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, momentum')
        .eq('id', user?.id || '')
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
  }, []);

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

      const anchors: Anchor[] = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        icon: a.icon,
        color: a.color,
        targetDays: a.target_days,
        minimumDuration: a.minimum_duration,
        consistency: a.consistency,
      }));

      setHabits(anchors);
    } catch (e) {
      console.warn('Failed to load anchors from Supabase', e);
      setHabits([]);
    }
  }, []);

  // Load today's sessions to determine completion state
  const loadSessions = useCallback(async () => {
    try {
      const todaySessions = await getTodaySessions();
      setSessions(todaySessions || []);
    } catch (e) {
      console.warn('Failed to load today sessions', e);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (__DEV__) {
        setXp(100);
        setMomentum(50);
      }
      await Promise.all([loadHabits(), loadSessions()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadHabits, loadSessions]);

  // Leveling calculations
  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

  // Anchor is completed today if it has a session
  const isAnchorCompleted = (anchorId: string) => {
    return sessions.some(s => s.anchor_id === anchorId);
  };

  // Anchor is due today if not completed
  const isAnchorDueToday = (anchorId: string) => {
    return !isAnchorCompleted(anchorId);
  };

  // Filter to show only anchors due today (incomplete ones)
  const anchorsDueToday = habits.filter(h => isAnchorDueToday(h.id));

  // For reference: show count of completed anchors
  const completedCount = habits.filter(h => isAnchorCompleted(h.id)).length;

  const renderAnchor = ({ item }: { item: Anchor }) => {
    return (
      <View style={[styles.anchorCard, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
        </View>

        <View style={styles.anchorInfo}>
          <Text style={[styles.anchorTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {item.title}
          </Text>
          <Text style={styles.anchorDetails}>
            {item.targetDays} days • {item.minimumDuration} min / session
          </Text>
        </View>

        <View style={styles.anchorStatus}>
          <FontAwesome5 name="circle" size={24} color={colors.neutral[300]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
            Welcome back
          </Text>
          <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.rankText, { color: colors.primary }]}>
              {rank}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
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
        </View>

        {/* Identity Line */}
        <Text style={[styles.identityLine, { color: isDark ? colors.dark.textMuted : colors.light.textMuted }]}>
          {IDENTITY_LINES[rank] || IDENTITY_LINES.Spark}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
        Anchors Due Today
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={anchorsDueToday}
            keyExtractor={(item) => item.id}
            renderItem={renderAnchor}
            contentContainerStyle={styles.list}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDark ? colors.dark.textMuted : colors.light.textMuted }]}>
                  All anchors completed today! Check back tomorrow or view all in Journey.
                </Text>
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
  },
  rankBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: spacing.lg,
  },
  statItem: {
    minWidth: '30%',
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  identityLine: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    ...baseStyles.flexCenter,
  },
  list: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  anchorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...baseStyles.flexCenter,
    marginRight: spacing.lg,
  },
  anchorInfo: {
    flex: 1,
  },
  anchorTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  anchorDetails: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  anchorStatus: {
    alignItems: 'flex-end',
  },
  emptyState: {
    flex: 1,
    ...baseStyles.flexCenter,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});