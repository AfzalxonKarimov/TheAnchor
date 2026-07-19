import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, typography, colors, corner, shadow } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel, LEVEL_THRESHOLDS } from '../lib/leveling';
import { getProfile } from '../src/supabase/profiles';
import { loadDashboardAnalytics } from '../src/supabase/analytics';
import {
  Surface,
  SectionHeader,
  StatTile,
  AreaChart,
  Heatmap,
  AchievementBadge,
  ProgressRing,
  Reveal,
  IconBadge,
  EmptyState,
} from '../src/components/ui';

interface Dash {
  heatmap: any;
  monthly: any[];
  recovery: { score: number; hasData: boolean };
  records: any;
  weekly: number[];
  achievements: any[];
}

export default function ProgressScreen() {
  const c = useThemeColors();
  const [xp, setXp] = useState(0);
  const [dash, setDash] = useState<Dash | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await getProfile();
      if (profile) setXp(profile.total_xp || 0);
      // Consistency heatmap should span from when the user joined, not a
      // fixed 6-month window. Fall back to ~26 weeks if no join date.
      let weeks = 26;
      const joined = profile?.created_at ? new Date(profile.created_at) : null;
      if (joined && !Number.isNaN(joined.getTime())) {
        const days = Math.max(0, Math.floor((Date.now() - joined.getTime()) / 86400000));
        weeks = Math.max(4, Math.ceil(days / 7));
      }
      const data = await loadDashboardAnalytics({ weeks, months: 6 });
      setDash(data as Dash);
    } catch (e) {
      console.warn('Progress load failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const thisMonth = dash?.monthly?.[dash.monthly.length - 1];
  const recovery = dash?.recovery?.score ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.header}>
            <Text style={[typography.displayXs, { color: c.text }]}>Progress</Text>
            <Text style={[typography.small, { color: c.textMuted, marginTop: spacing.xs }]}>
              {rank} · Level {level}
            </Text>
          </View>
        </Reveal>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !dash ? (
          <EmptyState
            icon="chart-bar"
            title="No data yet"
            subtitle="Complete a few check-ins to see your consistency take shape."
          />
        ) : (
          <>
            {/* Recovery — hero section */}
            <Reveal delay={60}>
              <Surface radius="xl" style={[styles.card, styles.recoveryHero]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ProgressRing progress={recovery / 100} size={108} strokeWidth={10} glow>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[typography.displayMd, { color: c.text }]}>{recovery}</Text>
                      <Text style={[typography.caption, { color: c.textMuted }]}>/100</Text>
                    </View>
                  </ProgressRing>
                  <View style={{ flex: 1, marginLeft: spacing.xl }}>
                    <Text style={[typography.eyebrow, { color: colors.primaryStrong }]}>RECOVERY SCORE</Text>
                    <Text style={[typography.heading, { color: c.text, marginTop: spacing.xs }]}>How fast you bounce back</Text>
                    <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.sm, lineHeight: 18 }]}>
                      {recovery >= 75
                        ? 'You return quickly after a miss. That’s the whole game.'
                        : recovery >= 50
                        ? 'Solid resilience. Shorter gaps keep this climbing.'
                        : 'Every return shortens the gap. Show up today.'}
                    </Text>
                  </View>
                </View>
              </Surface>
            </Reveal>

            {/* Hero stats */}
            <Reveal delay={100}>
              <View style={styles.heroRow}>
                <StatTile label="Focused hours" value={dash.records.totalHours} icon="clock" tint={colors.primary} />
                <StatTile label="Longest streak" value={dash.records.longestStreak} icon="fire" tint={colors.warning} />
              </View>
            </Reveal>

            {/* Activity chart */}
            <Reveal delay={140}>
              <Surface radius="xl" style={styles.card}>
                <SectionHeader title="Activity" subtitle="Sessions per week" />
                <AreaChart
                  data={dash.weekly}
                  height={248}
                  formatValue={(v) => `${v} sessions`}
                />
                <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.md }]}>
                  {dash.weekly.reduce((a, b) => a + b, 0)} sessions in the last {dash.weekly.length} weeks
                </Text>
              </Surface>
            </Reveal>

            {/* Consistency heatmap */}
            <Reveal delay={180}>
              <Surface radius="xl" style={styles.card}>
                <SectionHeader title="Consistency" subtitle="Last 6 months" />
                <Heatmap weeks={dash.heatmap.weeks} dates={dash.heatmap.dates} monthLabels={dash.heatmap.monthLabels} />
              </Surface>
            </Reveal>

            {/* This month */}
            <Reveal delay={220}>
              <Surface radius="xl" style={styles.card}>
                <SectionHeader title="This month" subtitle={thisMonth?.label} />
                <View style={styles.monthGrid}>
                  <MonthStat icon="calendar-check" label="Sessions" value={thisMonth?.sessions ?? 0} tint={colors.primary} />
                  <MonthStat icon="hourglass-half" label="Minutes" value={thisMonth?.minutes ?? 0} tint={colors.accentGlow} />
                  <MonthStat icon="calendar-day" label="Active days" value={thisMonth?.activeDays ?? 0} tint={colors.success} />
                  <MonthStat icon="bolt" label="Best day" value={thisMonth?.bestDay ?? 0} tint={colors.warning} />
                </View>
              </Surface>
            </Reveal>

            {/* Achievements */}
            <Reveal delay={260}>
              <SectionHeader title="Achievements" subtitle={`${dash.achievements.filter((a) => a.unlocked).length} of ${dash.achievements.length}`} />
              <Surface radius="xl" style={styles.card}>
                <View style={styles.achGrid}>
                  {dash.achievements.map((a: any) => (
                    <AchievementBadge key={a.key} glyph={a.glyph} title={a.title} unlocked={a.unlocked} />
                  ))}
                </View>
              </Surface>
            </Reveal>

            {/* Personal records */}
            <Reveal delay={300}>
              <Surface radius="xl" style={styles.card}>
                <SectionHeader title="Personal records" />
                <View style={styles.recGrid}>
                  <Record icon="hourglass" label="Longest session" value={`${dash.records.longestSessionMin} min`} />
                  <Record icon="calendar-alt" label="Most in a day" value={`${dash.records.mostInDay}`} />
                  <Record icon="check-circle" label="Total check-ins" value={`${dash.records.totalCheckins}`} />
                  <Record icon="fire" label="Current streak" value={`${dash.records.currentStreak}`} />
                </View>
              </Surface>
            </Reveal>

            {/* Level timeline */}
            <Reveal delay={340}>
              <Surface radius="xl" style={styles.card}>
                <SectionHeader title="Level timeline" subtitle="Your climb" />
                <LevelTimeline level={level} />
              </Surface>
            </Reveal>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MonthStat({ icon, label, value, tint }: { icon: string; label: string; value: number; tint: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.monthStat}>
      <IconBadge name={icon} color={tint} box={36} size={16} />
      <Text style={[typography.headingLg, { color: c.text, marginTop: spacing.sm }]}>{value}</Text>
      <Text style={[typography.caption, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function Record({ icon, label, value }: { icon: string; label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.recItem, { backgroundColor: c.surfaceAlt, borderColor: c.hairline }]}>
      <IconBadge name={icon} color={colors.primary} box={36} size={16} />
      <Text style={[typography.headingLg, { color: c.text, marginTop: spacing.sm }]}>{value}</Text>
      <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>{label}</Text>
    </View>
  );
}

/**
 * Horizontal level timeline — nodes on a rail. Current level is filled +
 * glowing with a "YOU" tag; past nodes are teal-tinted; future nodes
 * fade back. Replaces the old stack of level cards.
 */
function LevelTimeline({ level }: { level: number }) {
  const c = useThemeColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeline}>
      {LEVEL_THRESHOLDS.map((thr, i) => {
        const lv = i + 1;
        const isCurrent = lv === level;
        const isPast = lv < level;
        const isFuture = lv > level;
        const isLast = i === LEVEL_THRESHOLDS.length - 1;
        return (
          <View key={lv} style={[styles.tlNode, { opacity: isFuture ? 0.5 : 1 }]}>
            {/* Connecting rail — drawn per node so it scrolls with the content
                (a single viewport-width line would detach from later nodes). */}
            {!isLast && (
              <View
                style={[styles.tlRail, { backgroundColor: lv <= level ? c.accentSoft : c.hairline }]}
              />
            )}
            {isCurrent && (
              <View style={[styles.tlYou, { backgroundColor: `${colors.primary}1F` }]}>
                <Text style={[typography.caption, { color: colors.primaryStrong, fontWeight: '700' }]}>YOU</Text>
              </View>
            )}
            <View
              style={[
                styles.tlDot,
                {
                  backgroundColor: isCurrent ? colors.primary : isPast ? `${colors.primary}24` : c.surfaceAlt,
                  borderColor: isCurrent ? colors.primary : isPast ? `${colors.primary}55` : c.hairline,
                  ...(isCurrent ? shadow.glow : {}),
                },
              ]}
            >
              {isCurrent && <View style={styles.tlCore} />}
            </View>
            <Text
              style={[
                typography.caption,
                {
                  color: isCurrent ? colors.primary : isFuture ? c.textMuted : c.text,
                  fontWeight: isCurrent ? '700' : '500',
                  marginTop: spacing.sm,
                },
              ]}
            >
              Lv {lv}
            </Text>
            <Text style={[typography.micro, { color: c.textMuted }]}>{thr} XP</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxxl },
  header: { marginBottom: spacing.lg },
  loading: { paddingVertical: spacing.xxxxl, alignItems: 'center' },
  heroRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  card: { padding: spacing.xl, marginBottom: spacing.lg },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  monthStat: { width: '47%', backgroundColor: undefined, marginBottom: spacing.sm },
  recoveryRow: { flexDirection: 'row', alignItems: 'center' },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.lg },
  recGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  recItem: { width: '47%', borderRadius: corner.lg, padding: spacing.lg, borderWidth: 1, ...shadow.soft },
  recoveryHero: { paddingVertical: spacing.xl },
  timeline: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  tlNode: { alignItems: 'center', width: 58, position: 'relative' },
  tlRail: { position: 'absolute', top: 22, left: 29, width: 58, height: 3, borderRadius: 2, zIndex: 0 },
  tlDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tlCore: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#fff' },
  tlYou: { position: 'absolute', top: -10, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: corner.pill },
});
