import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel } from '../lib/leveling';

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
  const [xp, setXp] = useState(150);
  const [momentum, setMomentum] = useState(62);
  const [weeklyStats, setWeeklyStats] = useState({
    sessions: 12,
    anchorsActive: 3,
    streak: 5,
  });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
                  width: `${(xp % 100) * 0.8}%`, // Simulated progress
                },
              ]}
            />
          </View>
          <Text style={styles.progressHint}>Earn 20 XP to reach Level {level + 1}</Text>
        </View>

        {/* Momentum Graph */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            Momentum
          </Text>
          <View style={styles.graphPlaceholder}>
            <FontAwesome5 name="chart-line" size={48} color={colors.neutral[300]} />
            <Text style={styles.graphLabel}>{momentum} pts</Text>
          </View>
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
  graphPlaceholder: {
    ...baseStyles.flexCenter,
    height: 120,
  },
  graphLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[600],
    marginTop: spacing.md,
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