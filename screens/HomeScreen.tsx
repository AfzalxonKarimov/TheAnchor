import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '../src/supabase/client';
import { getLevelFromXP, getRankFromLevel } from '../lib/leveling';
import { spacing, typography, colors, corner, shadow, navigationTokens } from '../src/constants/theme';
import { Anchor, RootStackParamList } from '../src/navigation/types';
import { getTodaySessions } from '../src/supabase/sessions';
import { getStreak } from '../src/supabase/streaks';
import { getProfile } from '../src/supabase/profiles';
import { settleMomentum, getMomentumSnapshot } from '../lib/momentum';
import { getWeeklySessionCounts } from '../src/supabase/sessions';
import { useReducedMotion } from '../src/hooks/useReducedMotion';
import {
  Surface,
  IconBadge,
  MomentumHero,
  QuoteCard,
  SectionHeader,
  EmptyState,
  Reveal,
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
  const [streak, setStreak] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);
  const [displayName, setDisplayName] = useState('there');
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

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
        // Only the very first load shows the skeleton — subsequent focus visits
        // refresh silently so the user never sees a spinner flash on return.
        const first = !hasLoaded.current;
        if (first) setIsLoading(true);
        await Promise.all([loadProfile(), loadHabits(), loadSessions(), loadStreak(), loadTrend()]);
        hasLoaded.current = true;
        if (first) setIsLoading(false);
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

  // Press feedback for the primary check-in CTA — scale dip + soft haptic.
  const quickScale = useRef(new Animated.Value(1)).current;
  const handleQuickIn = () => {
    Animated.spring(quickScale, { toValue: 0.97, tension: 200, friction: 18, useNativeDriver: true }).start();
  };
  const handleQuickOut = () => {
    Animated.spring(quickScale, { toValue: 1, tension: 200, friction: 16, useNativeDriver: true }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

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
            <View style={[styles.rankChip, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}33` }]}>
              <AchievementGlyph name="anchor" size={13} color={colors.primaryStrong} />
              <Text style={[typography.caption, { color: colors.primaryStrong, fontWeight: '700', marginLeft: spacing.sm, letterSpacing: 0.3 }]}>
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

        {/* Recovery nudge — sits right under the hero (its bottom padding
            supplies the gap); the Daily insight below gets a matching gap. */}
        {(missedYesterday || anchorsDueToday.length > 0) && (
          <Reveal delay={160}>
            <Surface tint={missedYesterday ? `${colors.warning}12` : c.surfaceAlt} radius="lg" style={styles.recovery}>
              <IconBadge name={missedYesterday ? 'seedling' : 'anchor'} color={missedYesterday ? colors.warning : colors.primary} box={36} size={16} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.small, { color: c.text, fontWeight: '700' }]}>
                  {missedYesterday ? 'Missed a day? That’s allowed.' : 'Keep your momentum moving'}
                </Text>
                <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                  {missedYesterday
                    ? 'No judgment. Today is a fresh anchor — just show up.'
                    : 'One session today is enough to keep moving forward.'}
                </Text>
              </View>
            </Surface>
          </Reveal>
        )}

        {/* Daily insight */}
        <Reveal delay={200} style={{ marginTop: spacing.lg }}>
          <QuoteCard />
        </Reveal>

        {/* Anchors due */}
        <Reveal delay={240}>
          <SectionHeader
            title="Anchors due today"
            subtitle={habits.length === 0 ? undefined : `${anchorsDueToday.length} to check in`}
            style={{ marginTop: spacing.lg }}
          />
        </Reveal>

        {isLoading ? (
          <HomeSkeleton />
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
              <TouchableWithoutFeedback
                onPress={startFirstDue}
                onPressIn={handleQuickIn}
                onPressOut={handleQuickOut}
              >
                <Animated.View
                  style={[styles.quickStart, { backgroundColor: colors.primary, transform: [{ scale: quickScale }] }]}
                >
                  <View style={styles.quickPlay}>
                    <FontAwesome5 name="play" size={13} color={colors.onAccent} style={{ marginLeft: 1.5 }} />
                  </View>
                  <Text style={styles.quickStartText}>Start check-in</Text>
                  <View style={styles.quickStartChevron}>
                    <FontAwesome5 name="chevron-right" size={14} color={colors.onAccent} />
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
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
  scroll: { padding: spacing.xl, paddingBottom: navigationTokens.tabClearance },
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
    paddingVertical: spacing.sm,
    borderRadius: corner.pill,
    borderWidth: 1,
  },
  recovery: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, padding: spacing.lg },
  anchorCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, minHeight: 76, marginTop: spacing.md },
  anchorInfo: { flex: 1, marginLeft: spacing.lg },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: corner.pill,
    marginTop: spacing.md,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  quickPlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(6,32,29,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  quickStartText: { ...typography.body, color: colors.onAccent, fontWeight: '700', marginLeft: 0 },
  quickStartChevron: { position: 'absolute', right: spacing.xl, opacity: 0.85 },
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

/**
 * Initial-load skeleton — calm shimmer placeholders that mirror the real
 * layout 1:1, so the first paint reads as a structured screen instead of a
 * bare spinner. Respects reduced-motion by holding a static mid-tone.
 */
function HomeSkeleton() {
  const c = useThemeColors();
  const reduced = useReducedMotion();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      shimmer.setValue(0.5);
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, [reduced, shimmer]);

  const Block = ({ h, w, r = corner.sm, style }: { h: number; w?: number | `${number}%`; r?: number; style?: ViewStyle }) => (
    <Animated.View
      style={[
        {
          height: h,
          width: w,
          borderRadius: r,
          opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] }),
          backgroundColor: c.hairline,
        },
        style,
      ]}
    />
  );

  const card = (children: React.ReactNode, style?: ViewStyle, key?: string | number) => (
    <View
      key={key}
      style={[
        {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.hairline,
          borderRadius: corner.lg,
          padding: spacing.xl,
          ...shadow.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Block h={14} w={120} style={{ marginBottom: spacing.sm }} />
          <Block h={32} w={160} />
        </View>
        <Block h={32} w={84} r={corner.pill} />
      </View>

      {/* Momentum hero */}
      {card(
        <View>
          <Block h={12} w={90} style={{ marginBottom: spacing.md }} />
          <Block h={52} w={150} style={{ marginBottom: spacing.lg }} />
          <Block h={160} w="100%" r={corner.md} />
        </View>,
        undefined,
        'momentum'
      )}

      {/* Stats strip */}
      {card(
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Block h={10} w={48} style={{ marginBottom: spacing.sm }} />
            <Block h={22} w={40} />
          </View>
          <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: c.hairline, paddingLeft: spacing.md }}>
            <Block h={10} w={64} style={{ marginBottom: spacing.sm }} />
            <Block h={22} w={48} />
          </View>
          <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: c.hairline, paddingLeft: spacing.md }}>
            <Block h={10} w={36} style={{ marginBottom: spacing.sm }} />
            <Block h={22} w={44} style={{ marginBottom: spacing.md }} />
            <Block h={6} w="100%" r={3} />
          </View>
        </View>,
        { marginTop: spacing.lg },
        'stats'
      )}

      {/* Daily insight */}
      {card(
        <View>
          <Block h={18} w={20} r={6} style={{ marginBottom: spacing.sm }} />
          <Block h={16} w="100%" style={{ marginBottom: spacing.xs }} />
          <Block h={16} w="80%" style={{ marginBottom: spacing.sm }} />
          <Block h={10} w={70} />
        </View>,
        { marginTop: spacing.lg, backgroundColor: c.surfaceAlt },
        'quote'
      )}

      {/* Anchors due */}
      <Block h={22} w={170} style={{ marginTop: spacing.lg, marginBottom: spacing.md }} />
      {[0, 1, 2].map((i) =>
        card(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Block h={44} w={44} r={22} />
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Block h={16} w="60%" style={{ marginBottom: spacing.xs }} />
              <Block h={12} w="40%" />
            </View>
            <Block h={40} w={40} r={20} />
          </View>,
          { marginTop: spacing.md },
          i
        )
      )}
    </View>
  );
}
