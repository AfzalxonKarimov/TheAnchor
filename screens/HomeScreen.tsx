import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/supabase/client';
import { getLevelFromXP, getRankFromLevel, getLevelProgress, getXPForNextLevel } from '../lib/leveling';
import { spacing, typography, colors, corner, shadow } from '../src/constants/theme';
import { Anchor, RootStackParamList } from '../src/navigation/types';
import { getTodaySessions } from '../src/supabase/sessions';
import { getStreak } from '../src/supabase/streaks';
import { getProfile } from '../src/supabase/profiles';
import { settleMomentum, getMomentumSnapshot } from '../lib/momentum';
import { getWeeklySessionCounts } from '../src/supabase/sessions';
import { getRecoveryScore } from '../src/supabase/analytics';
import {
  Surface,
  IconBadge,
  MomentumHero,
  QuoteCard,
  SectionHeader,
  EmptyState,
  Reveal,
  XPBar,
  AchievementGlyph,
  MomentumStatus,
} from '../src/components/ui';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const STATUS_SUB: Record<MomentumStatus, string> = {
  strong: 'You’re showing up consistently. Keep the tide moving.',
  on_track: 'Steady momentum. One session keeps it alive.',
  recovering: 'A dip is part of the curve. Today resets it.',
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const c = useThemeColors();
  const [habits, setHabits] = useState<Anchor[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [momentumDelta, setMomentumDelta] = useState(0);
  const [recovery, setRecovery] = useState(0);
  const [streak, setStreak] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);
  const [displayName, setDisplayName] = useState('there');
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setXp(profile.total_xp || 0);
        setMomentum(profile.momentum || 50);
        // New profiles get an auto-generated `user_<id>` handle (see migration
        // 0002 + profiles.js/sessions.js). That's an id, not a name — treat it
        // as "no name set" and fall back to a friendly greeting instead of
        // rendering the id fragment after "Good afternoon".
        const rawName = profile.username || '';
        const isAutoHandle = /^user_/i.test(rawName);
        setDisplayName(!isAutoHandle && rawName ? rawName : 'there');
      }
      const snap = await getMomentumSnapshot();
      if (snap) setMomentumDelta(snap.delta);
      const settled = await settleMomentum();
      if (settled != null) setMomentum(settled);
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
  }, []);

  const loadRecovery = useCallback(async () => {
    try {
      const r = await getRecoveryScore();
      if (r) setRecovery(r.score || 0);
    } catch (e) {
      console.warn('Failed to load recovery', e);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('anchors').select('*').order('created_at', { ascending: false });
      if (error) {
        setHabits([]);
        return;
      }
      setHabits(
        (data || []).map((a: any) => ({
          id: a.id, title: a.title, icon: a.icon, color: a.color,
          targetDays: a.target_days, minimumDuration: a.minimum_duration, consistency: a.consistency,
        }))
      );
    } catch (e) {
      setHabits([]);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setSessions((await getTodaySessions()) || []);
    } catch (e) {
      setSessions([]);
    }
  }, []);

  const loadStreak = useCallback(async () => {
    try {
      setStreak((await getStreak()) || 0);
    } catch (e) {
      setStreak(0);
    }
  }, []);

  const loadTrend = useCallback(async () => {
    try {
      setTrend(await getWeeklySessionCounts(12));
    } catch (e) {
      setTrend([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([loadProfile(), loadRecovery(), loadHabits(), loadSessions(), loadStreak(), loadTrend()]);
        setIsLoading(false);
      };
      loadData();
    }, [loadProfile, loadHabits, loadSessions, loadStreak, loadTrend])
  );

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const isCompleted = (id: string) => sessions.some((s) => s.anchor_id === id);
  const anchorsDueToday = habits.filter((h) => !isCompleted(h.id));
  const completedCount = habits.length - anchorsDueToday.length;

  const status: MomentumStatus = momentum >= 70 ? 'strong' : momentum >= 45 ? 'on_track' : 'recovering';

  const startSession = (anchor: Anchor) => navigation.navigate('session', { anchorId: anchor.id });
  const startFirstDue = () => anchorsDueToday[0] && startSession(anchorsDueToday[0]);

  const missedYesterday = habits.length > 0 && anchorsDueToday.length > 0 && streak === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Reveal>
          <View style={styles.header}>
            <View>
              <Text style={[typography.small, { color: c.textMuted }]}>{getGreeting()}</Text>
              <Text style={[typography.displaySm, { color: c.text, marginTop: spacing.xs }]}>
                {displayName}
              </Text>
            </View>
            <View style={[styles.rankChip, { backgroundColor: `${colors.primary}1F` }]}>
              <AchievementGlyph name="anchor" size={12} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primaryStrong, fontWeight: '700', marginLeft: spacing.sm }]}>
                {rank}
              </Text>
            </View>
          </View>
        </Reveal>

        {/* Momentum hero */}
        <Reveal delay={60}>
          <MomentumHero
            momentum={momentum}
            trend={trend}
            status={status}
            delta={momentumDelta}
            subLine={STATUS_SUB[status]}
          />
        </Reveal>

        {/* Hero stats: Level · Recovery · XP — one quiet strip */}
        <Reveal delay={120}>
          <View style={[styles.heroStats, { backgroundColor: c.surface, borderColor: c.hairline }]}>
            <View style={[styles.heroStat, { borderRightWidth: 1, borderRightColor: c.hairline }]}>
              <Text style={[typography.eyebrow, { color: c.textMuted }]}>LEVEL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs }}>
                <Text style={[typography.title, { color: c.text }]}>{level}</Text>
                <Text style={[typography.small, { color: c.textMuted, marginLeft: spacing.xs }]}>· {rank}</Text>
              </View>
              <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                {getXPForNextLevel(xp) - xp} XP to go
              </Text>
            </View>
            <View style={[styles.heroStat, { borderRightWidth: 1, borderRightColor: c.hairline }]}>
              <Text style={[typography.eyebrow, { color: c.textMuted }]}>RECOVERY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs }}>
                <Text style={[typography.title, { color: c.text }]}>{recovery}</Text>
                <Text style={[typography.small, { color: c.textMuted, marginLeft: spacing.xs }]}>/100</Text>
              </View>
              <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                {recovery >= 75 ? 'Bounces back fast' : recovery >= 50 ? 'Building resilience' : 'Show up today'}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[typography.eyebrow, { color: c.textMuted }]}>XP</Text>
              <Text style={[typography.title, { color: c.text, marginTop: spacing.xs }]}>{xp}</Text>
              <View style={{ marginTop: spacing.sm }}>
                <XPBar progress={getLevelProgress(xp)} height={6} />
              </View>
            </View>
          </View>
        </Reveal>

        {/* Daily insight */}
        <Reveal delay={160}>
          <QuoteCard />
        </Reveal>

        {/* Recovery nudge */}
        {(missedYesterday || (anchorsDueToday.length > 0 && streak > 0)) && (
          <Reveal delay={200}>
            <Surface tint={missedYesterday ? `${colors.warning}12` : c.surfaceAlt} radius="lg" style={styles.recovery}>
              <IconBadge name={missedYesterday ? 'seedling' : 'fire'} color={missedYesterday ? colors.warning : colors.primary} box={36} size={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.small, { color: c.text, fontWeight: '700' }]}>
                  {missedYesterday ? 'Missed a day? That’s allowed.' : 'Keep your streak alive'}
                </Text>
                <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                  {missedYesterday
                    ? 'No judgment. Today is a fresh anchor — just show up.'
                    : `Day ${streak} and counting. One session protects it.`}
                </Text>
              </View>
            </Surface>
          </Reveal>
        )}

        {/* Anchors due */}
        <Reveal delay={240}>
          <SectionHeader
            title="Anchors due today"
            subtitle={habits.length === 0 ? undefined : `${anchorsDueToday.length} to check in`}
            style={{ marginTop: spacing.lg }}
          />
        </Reveal>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : habits.length === 0 ? (
          <EmptyState
            icon="anchor"
            title="Drop your first anchor"
            subtitle="An anchor is a routine you return to on the days motivation runs out. Start with one."
            cta={{ label: 'Create Anchor', onPress: () => navigation.navigate('AddHabit') }}
          />
        ) : anchorsDueToday.length === 0 ? (
          <DoneState />
        ) : (
          <>
            <Reveal delay={260}>
              <TouchableOpacity
                onPress={startFirstDue}
                activeOpacity={0.85}
                style={[styles.quickStart, { backgroundColor: colors.primary }]}
              >
                <FontAwesome5 name="play" size={16} color={colors.onAccent} />
                <Text style={styles.quickStartText}>Start check-in</Text>
                <View style={styles.quickStartChevron}>
                  <FontAwesome5 name="chevron-right" size={14} color={colors.onAccent} />
                </View>
              </TouchableOpacity>
            </Reveal>

            {anchorsDueToday.map((anchor, i) => (
              <Reveal key={anchor.id} delay={280 + i * 50}>
                <Surface onPress={() => startSession(anchor)} radius="lg" style={styles.anchorCard}>
                  <IconBadge name={anchor.icon} color={anchor.color} />
                  <View style={styles.anchorInfo}>
                    <Text style={[typography.headingSm, { color: c.text }]}>{anchor.title}</Text>
                    <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                      {anchor.targetDays} days • {anchor.minimumDuration} min
                    </Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: `${colors.primary}1F` }]}>
                    <FontAwesome5 name="play" size={14} color={colors.primary} />
                  </View>
                </Surface>
              </Reveal>
            ))}
          </>
        )}

        {completedCount > 0 && anchorsDueToday.length > 0 && (
          <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.lg }]}>
            {completedCount} done today · nice.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: corner.pill,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: corner.lg,
    borderWidth: 1,
    ...shadow.soft,
  },
  heroStat: { flex: 1, paddingHorizontal: spacing.md },
  recovery: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, padding: spacing.lg },
  anchorCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginTop: spacing.md },
  anchorInfo: { flex: 1, marginLeft: spacing.lg },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: corner.pill,
    marginTop: spacing.md,
  },
  quickStartText: { ...typography.body, color: colors.onAccent, fontWeight: '700', marginLeft: spacing.sm },
  quickStartChevron: { marginLeft: spacing.sm, opacity: 0.8 },
  loading: { paddingVertical: spacing.xxxxl },
  doneWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxxl, position: 'relative' },
  doneHalo: {
    position: 'absolute',
    top: spacing.xxxl - 36,
    left: '50%',
    marginLeft: -66,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: `${colors.success}14`,
  },
  doneCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.success}1A`,
    borderWidth: 1,
    borderColor: `${colors.success}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** Premium "all done" state — soft glow + large check, no dead-end feel. */
function DoneState() {
  const c = useThemeColors();
  const scale = useRef(new Animated.Value(0.82)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [scale, glow]);

  return (
    <View style={styles.doneWrap}>
      <Animated.View style={[styles.doneHalo, { opacity: glow, transform: [{ scale }] }]} />
      <Animated.View style={[styles.doneCircle, { transform: [{ scale }] }]}>
        <AchievementGlyph name="check" size={52} color={colors.success} />
      </Animated.View>
      <Text style={[typography.heading, { color: c.text, textAlign: 'center', marginTop: spacing.lg }]}>
        All checked in
      </Text>
      <Text style={[typography.body, { color: c.textMuted, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm }]}>
        Every anchor is done for today. Show up again tomorrow and the streak keeps building.
      </Text>
    </View>
  );
}
