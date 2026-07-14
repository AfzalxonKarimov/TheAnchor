import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel, getLevelProgress, getXPForNextLevel } from '../lib/leveling';
import { supabase } from '../src/supabase/client';
import { getStreak } from '../src/supabase/streaks';
import { getWeeklySessionCounts } from '../src/supabase/sessions';
import { getProfile } from '../src/supabase/profiles';
import { settleMomentum } from '../lib/momentum';

/**
 * Progress Screen - Analytics dashboard.
 *
 * Design decisions:
 * - Card-based layout for clear data separation
 * - Momentum graph placeholder for visualization
 * - Level and rank prominently displayed
 * - Smooth scroll for all content
 */
export default function ProgressScreen() {
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [weeklyStats, setWeeklyStats] = useState({
    sessions: 0,
    anchorsActive: 0,
    streak: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([]);
  const { isDark } = useTheme();

  const loadProgressData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load profile data (XP, momentum) using shared helper
      const profile = await getProfile();
      if (profile) {
        setXp(profile.total_xp || 0);
        setMomentum(profile.momentum || 50);
      }

      // Settle any pending momentum decay and reflect the up-to-date value.
      const settled = await settleMomentum();
      if (settled != null) setMomentum(settled);

      if (!user) {
        // Dev (e.g. Skip Login) has no authenticated user, so there's no real
        // data to chart. Seed a demo dashboard so the UI is visible while testing.
        if (__DEV__) {
          setXp(100);
          setMomentum(50);
          setWeeklyActivity([2, 4, 3, 5, 7, 6, 8, 5]);
          setWeeklyStats({ sessions: 24, anchorsActive: 3, streak: 5 });
        }
        return;
      }

      // Load this week's session count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      // Load anchor count
      const { count: anchorCount } = await supabase
        .from('anchors')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Load streak
      const streak = await getStreak();

      // Load weekly activity for the momentum chart
      const activity = await getWeeklySessionCounts(8);
      setWeeklyActivity(activity);

      setWeeklyStats({
        sessions: sessionCount || 0,
        anchorsActive: anchorCount || 0,
        streak,
      });
    } catch (e) {
      console.warn('Failed to load progress data:', e);
    }
  }, []);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [loadProgressData])
  );

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
            Progress
          </Text>
        </View>

        {/* Level Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
          <View style={styles.levelRow}>
            <View>
              <Text style={[styles.levelLabel, { color: colors.neutral[500] }]}>
                Level {level}
              </Text>
              <Text style={[styles.levelText, { color: isDark ? colors.dark.text : colors.light.text }]}>
                {rank}
              </Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.xpText, { color: colors.primary }]}>{xp} XP</Text>
            </View>
          </View>

          {/* Progress bar to next level */}
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
          <Text style={styles.progressHint}>Earn {getXPForNextLevel(xp) - xp} XP to reach Level {level + 1}</Text>
        </View>

        {/* Momentum Graph */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            Momentum
          </Text>
          <MomentumBarChart data={weeklyActivity} isDark={isDark} />
          <Text style={styles.chartCaption}>
            {momentum} pts · last 8 weeks
          </Text>
        </View>

        {/* Weekly Stats */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            This Week
          </Text>
          <View style={styles.statsGrid}>
            <StatItem value={weeklyStats.sessions} label="Sessions" icon="clock" />
            <StatItem value={weeklyStats.anchorsActive} label="Anchors Active" icon="anchor" />
            <StatItem value={weeklyStats.streak} label="Day Streak" icon="fire" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MomentumBarChart({ data, isDark }: { data: number[]; isDark: boolean }) {
  const hasActivity = data.length > 0 && data.some((n) => n > 0);

  if (!hasActivity) {
    return (
      <View style={styles.chartEmpty}>
        <FontAwesome5 name="chart-line" size={36} color={colors.neutral[300]} />
        <Text style={styles.chartEmptyText}>No activity yet</Text>
        <Text style={styles.chartEmptySubtext}>
          Complete check-ins to build your momentum
        </Text>
      </View>
    );
  }

  const max = Math.max(1, ...data);

  return (
    <View style={styles.chartRow}>
      {data.map((count, i) => {
        const heightPct = Math.max(4, (count / max) * 96);
        return (
          <View key={i} style={styles.chartBarWrap}>
            <View
              style={[
                styles.chartBar,
                {
                  height: heightPct,
                  backgroundColor: colors.primary,
                  opacity: count === 0 ? 0.15 : 1,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function StatItem({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <View style={styles.statItem}>
      <FontAwesome5 name={icon as any} size={20} color={colors.primary} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelText: {
    ...typography.title,
    fontWeight: '700',
  },
  xpBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    gap: spacing.sm,
  },
  chartBarWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  chartCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  chartEmpty: {
    ...baseStyles.flexCenter,
    height: 110,
  },
  chartEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[500],
    marginTop: spacing.sm,
  },
  chartEmptySubtext: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    ...baseStyles.flexCenter,
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
});