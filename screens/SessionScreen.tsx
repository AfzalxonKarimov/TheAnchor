import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { FontAwesome5 } from '@expo/vector-icons';
import { AchievementGlyph } from '../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { spacing, typography, colors, corner } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';
import { supabase } from '../src/supabase/client';
import { awardSessionXP } from '../src/supabase/sessions';
import { updateMomentum } from '../lib/momentum';
import { getStreak } from '../src/supabase/streaks';
import LevelUpModal from '../src/components/LevelUpModal';
import { ProgressRing } from '../src/components/ui';
import { BreathingPulse } from '../src/components/ui';
import { FloatingParticles } from '../src/components/ui';

interface LevelUpInfo {
  newLevel: number; newRank: string; xpAwarded: number; rankChanged: boolean;
}
interface SessionScreenProps {
  route: { params: { anchorId: string } };
  navigation: any;
}

const RING_STROKE = 16;

export default function SessionScreen({ route, navigation }: SessionScreenProps) {
  const { anchorId } = route.params;
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  // Never let the ring overflow narrow devices (e.g. iPhone SE ~320pt wide).
  const RING_SIZE = Math.min(280, width - 64);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [celebration, setCelebration] = useState<{ xp: number; streak: number } | null>(null);
  const [burst, setBurst] = useState(0);

  const startTs = useRef<number | null>(null);
  const accumulated = useRef(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const celebrateScale = useRef(new Animated.Value(0.9)).current;
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadAnchor = async () => {
      try {
        const { data, error } = await supabase.from('anchors').select('*').eq('id', anchorId).single();
        if (!error && data) {
          setAnchor({ id: data.id, title: data.title, icon: data.icon, color: data.color, targetDays: data.target_days, minimumDuration: data.minimum_duration, consistency: data.consistency });
        }
      } catch (e) {
        if (__DEV__) setAnchor({ id: anchorId, title: 'Session', icon: 'clock', color: '#2DD4BF', targetDays: 7, minimumDuration: 15, consistency: 50 });
      }
    };
    loadAnchor();
  }, [anchorId]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive, pulse]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (startTs.current == null) return;
      setSeconds(Math.floor(accumulated.current + (Date.now() - startTs.current) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [isActive]);

  const getElapsed = () => {
    const running = startTs.current != null ? (Date.now() - startTs.current) / 1000 : 0;
    return accumulated.current + running;
  };

  const goalSeconds = (anchor?.minimumDuration ?? 15) * 60;
  const progress = Math.min(seconds / goalSeconds, 1);
  const minimumMet = seconds >= goalSeconds;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60); const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startTs.current = Date.now();
    setIsActive(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  const handlePause = () => {
    if (startTs.current != null) {
      accumulated.current += (Date.now() - startTs.current) / 1000;
      startTs.current = null;
    }
    setIsActive(false);
  };
  const resetTimer = () => { accumulated.current = 0; startTs.current = null; setSeconds(0); setIsActive(false); };

  const doFinish = async (elapsed: number) => {
    if (elapsed < 1) { Alert.alert('Error', 'Session must be at least 1 second'); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Not authenticated'); setIsSaving(false); return; }
      let result;
      try { result = await awardSessionXP({ anchorId, durationSeconds: Math.round(elapsed) }); }
      catch (rpcError) { console.error(rpcError); Alert.alert('Error', 'Failed to save session.'); setIsSaving(false); return; }
      try { const streak = await getStreak(); await updateMomentum({ userId: user.id, durationSeconds: Math.round(elapsed), streak }); } catch (e) { console.warn(e); }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setBurst((b) => b + 1);
      const streak = await getStreak();
      setCelebration({ xp: result.xpAwarded, streak });
      celebrateScale.setValue(0.9); celebrateOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(celebrateScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(celebrateOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();

      resetTimer();
      if (result.leveledUp) {
        setTimeout(() => {
          setCelebration(null);
          setLevelUpInfo({ newLevel: result.newLevel, newRank: result.newRank, xpAwarded: result.xpAwarded, rankChanged: result.rankChanged });
        }, 1400);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save session.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    const elapsed = getElapsed();
    if (elapsed < goalSeconds) {
      Alert.alert('End early?', `You’re under the ${anchor?.minimumDuration ?? 15}-minute minimum. End anyway?`,
        [{ text: 'Keep going', style: 'cancel' }, { text: 'End anyway', style: 'destructive', onPress: () => doFinish(elapsed) }]);
    } else doFinish(elapsed);
  };

  const ringColor = minimumMet ? colors.success : colors.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {/* Ambient background */}
      <View style={styles.ambient} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: minimumMet ? colors.success : colors.primary, opacity: 0.06 }]} />
        <BreathingPulse size={RING_SIZE + 120} color={ringColor} rings={3} style={styles.breath} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={[styles.closeBtn, { backgroundColor: c.surfaceAlt }]}>
            <FontAwesome5 name="times" size={16} color={c.textSecondary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[typography.heading, { color: c.text }]}>{anchor?.title || 'Session'}</Text>
            <Text style={[typography.caption, { color: c.textMuted, marginTop: 2 }]}>Stay focused — you’ve got this</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.timerWrap}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <ProgressRing progress={progress} size={RING_SIZE} strokeWidth={RING_STROKE} glow gradient color={ringColor}>
              <View style={styles.readout}>
                <Text style={[styles.timerText, { color: c.text }]}>{formatTime(seconds)}</Text>
                <Text style={[typography.caption, { color: c.textMuted, marginTop: 4 }]}>goal {formatTime(goalSeconds)}</Text>
                <Text style={[typography.small, { color: minimumMet ? colors.success : c.textMuted, marginTop: spacing.xs, fontWeight: '700' }]}>
                  {minimumMet ? 'Minimum met' : `${Math.ceil((goalSeconds - seconds) / 60)} min to go`}
                </Text>
              </View>
            </ProgressRing>
          </Animated.View>
        </View>

        <View style={styles.controls}>
          {!isActive ? (
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleStart} activeOpacity={0.85}>
              <FontAwesome5 name="play" size={20} color={colors.onAccent} />
              <Text style={styles.primaryButtonText}>Start Session</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={[styles.controlButton, { backgroundColor: c.surfaceAlt }]} onPress={handlePause} activeOpacity={0.8}>
                <FontAwesome5 name="pause" size={18} color={c.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.finishButton, { backgroundColor: colors.success }, isSaving && styles.disabled]}
                onPress={handleFinish}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                <Text style={styles.finishButtonText}>{isSaving ? 'Saving…' : 'Finish'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FloatingParticles trigger={burst} color={c.accentSoft} style={styles.particles} />

      {/* Completion celebration */}
      {celebration && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', opacity: celebrateOpacity }]}>
          <Animated.View style={[styles.celebrateCard, { backgroundColor: c.surface, transform: [{ scale: celebrateScale }] }]}>
            <View style={[styles.celebrateIcon, { backgroundColor: `${colors.success}1F` }]}>
              <AchievementGlyph name="check" size={32} color={colors.success} />
            </View>
            <Text style={[typography.heading, { color: c.text, marginTop: spacing.md }]}>Session complete</Text>
            <View style={[styles.xpPill, { backgroundColor: `${colors.primary}1F` }]}>
              <FontAwesome5 name="bolt" size={13} color={colors.primary} />
              <Text style={[typography.small, { color: colors.primaryStrong, fontWeight: '700', marginLeft: spacing.sm }]}>+{celebration.xp} XP</Text>
            </View>
            <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.md }]}>
              Day {celebration.streak} streak · momentum restored
            </Text>
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setCelebration(null); navigation.goBack(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueText}>Nice</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      <LevelUpModal
        visible={levelUpInfo !== null}
        level={levelUpInfo?.newLevel ?? 0}
        rank={levelUpInfo?.newRank ?? ''}
        xpAwarded={levelUpInfo?.xpAwarded ?? 0}
        rankChanged={levelUpInfo?.rankChanged}
        onContinue={() => { setLevelUpInfo(null); navigation.goBack(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  breath: { opacity: 0.5 },
  content: { flex: 1, padding: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  timerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readout: { alignItems: 'center', justifyContent: 'center' },
  timerText: { ...typography.displayLarge },
  controls: { alignItems: 'center', marginBottom: spacing.xxxl },
  primaryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: corner.pill, gap: spacing.md },
  primaryButtonText: { ...typography.headingMd, color: colors.onAccent, fontWeight: '700' },
  activeControls: { flexDirection: 'row', gap: spacing.xl, alignItems: 'center' },
  controlButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  finishButton: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, borderRadius: corner.pill },
  disabled: { opacity: 0.5 },
  finishButtonText: { ...typography.body, color: colors.onAccent, fontWeight: '700' },
  particles: { ...StyleSheet.absoluteFillObject },
  celebrateCard: { width: '85%', maxWidth: 340, borderRadius: corner.xl, padding: spacing.xxl, alignItems: 'center' },
  celebrateIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  xpPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: corner.pill, marginTop: spacing.lg },
  continueBtn: { width: '100%', paddingVertical: spacing.lg, borderRadius: corner.md, marginTop: spacing.xl },
  continueText: { ...typography.body, color: colors.onAccent, fontWeight: '700', textAlign: 'center' },
});
