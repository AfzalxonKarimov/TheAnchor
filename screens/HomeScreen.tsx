import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase/client';

import {
  getLevelFromXP,
  getRankFromLevel,
  getLevelProgress,
  getXPForNextLevel,
} from '../lib/leveling';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { Anchor, RootStackParamList } from '../src/navigation/types';
import { getTodaySessions } from '../src/supabase/sessions';
import { getStreak } from '../src/supabase/streaks';
import { getProfile } from '../src/supabase/profiles';
import { settleMomentum } from '../lib/momentum';

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
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<Anchor[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();

  // Load profile data from Supabase
  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setXp(profile.total_xp || 0);
        setMomentum(profile.momentum || 50);
      }
      // Settle any pending momentum decay and reflect the up-to-date value.
      const settled = await settleMomentum();
      if (settled != null) setMomentum(settled);
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

  // Load current day streak (for the celebratory empty state)
  const loadStreak = useCallback(async () => {
    try {
      const streakVal = await getStreak();
      setStreak(streakVal || 0);
    } catch (e) {
      console.warn('Failed to load streak', e);
      setStreak(0);
    }
  }, []);

  // Reload anchors/sessions/profile on mount and whenever the screen is focused,
  // so anchors created via the "+" button appear immediately.
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([loadProfile(), loadHabits(), loadSessions(), loadStreak()]);
        setIsLoading(false);
      };
      loadData();
    }, [loadProfile, loadHabits, loadSessions, loadStreak])
  );

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
            {getGreeting()}
          </Text>
          <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.rankText, { color: colors.primary }]}>
              {rank}
            </Text>
          </View>
        </View>

        {/* Momentum hero — persistent headline metric, shown in every state
            (anchors due OR all done). Our core differentiator: a score that
            dips and recovers, not a streak that resets to zero. */}
        <View style={[styles.momentumCard, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
          <View style={styles.momentumHeader}>
            <FontAwesome5 name="chart-line" size={22} color={colors.primary} />
            <Text style={styles.momentumLabel}>Momentum</Text>
          </View>
          <Text style={[styles.momentumValue, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {momentum}
          </Text>
          {streak > 0 && (
            <Text style={styles.streakCaption}>Day {streak}</Text>
          )}
        </View>

        {/* Stats Row — quick-glance context beneath the Momentum hero:
            what's due, XP, Level. Momentum is intentionally NOT repeated here. */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Anchors due</Text>
            <Text style={styles.statValue}>{anchorsDueToday.length}</Text>
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

        {/* XP progress to next level */}
        <View style={[styles.progressBar, { backgroundColor: colors.neutral[200] }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${getLevelProgress(xp) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressHint}>
          Earn {getXPForNextLevel(xp) - xp} XP to reach Level {level + 1}
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
            ListEmptyComponent={() =>
              habits.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome5
                    name="anchor"
                    size={40}
                    color={colors.neutral[300]}
                    style={{ marginBottom: spacing.lg }}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      {
                        color: isDark ? colors.dark.textMuted : colors.light.textMuted,
                        marginBottom: spacing.lg,
                      },
                    ]}
                  >
                    No anchors yet. Create your first one to start building momentum.
                  </Text>
                  <TouchableOpacity
                    style={styles.addAnchorButton}
                    onPress={() => navigation.navigate('AddHabit')}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.addAnchorButtonText}>Add Anchor</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <FontAwesome5
                    name="check-circle"
                    size={40}
                    color={colors.success}
                    style={{ marginBottom: spacing.md }}
                  />
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDark ? colors.dark.text : colors.light.text },
                    ]}
                  >
                    All done for today
                  </Text>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? colors.dark.textMuted : colors.light.textMuted },
                    ]}
                  >
                    Every anchor is checked in. Show up again tomorrow and the streak keeps building.
                  </Text>
                </View>
              )
            }
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
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
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
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  momentumCard: {
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  momentumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  momentumLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  momentumValue: {
    fontSize: 44,
    fontWeight: '800',
    marginTop: spacing.sm,
    lineHeight: 48,
  },
  streakCaption: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  addAnchorButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  addAnchorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});