import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, animation, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';
import { supabase } from '../src/supabase/client';
import { awardSessionXP } from '../src/supabase/sessions';
import { updateMomentum } from '../lib/momentum';
import { getStreak } from '../src/supabase/streaks';
import LevelUpModal from '../src/components/LevelUpModal';

interface LevelUpInfo {
  newLevel: number;
  newRank: string;
  xpAwarded: number;
  rankChanged: boolean;
}

interface SessionScreenProps {
  route: {
    params: {
      anchorId: string;
    };
  };
  navigation: any;
}

/**
 * Session Screen - Timer for active anchor sessions.
 *
 * Design decisions:
 * - Full-screen immersive timer
 * - Large, clear time display
 * - Start/Pause/Finish controls
 * - Haptic feedback on session events
 * - Saves session to Supabase on finish
 */
export default function SessionScreen({ route, navigation }: SessionScreenProps) {
  const { anchorId } = route.params;
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [seconds, setSeconds] = useState(0); // Elapsed time
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const { isDark } = useTheme();

  // Animation for pulse effect when timer is active
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load anchor data on mount
  useEffect(() => {
    const loadAnchor = async () => {
      try {
        const { data, error } = await supabase
          .from('anchors')
          .select('*')
          .eq('id', anchorId)
          .single();

        if (!error && data) {
          setAnchor({
            id: data.id,
            title: data.title,
            icon: data.icon,
            color: data.color,
            targetDays: data.target_days,
            minimumDuration: data.minimum_duration,
            consistency: data.consistency,
          });
        }
      } catch (e) {
        console.warn('Failed to load anchor:', e);
        // In dev mode, use placeholder
        if (__DEV__) {
          setAnchor({
            id: anchorId,
            title: 'Session',
            icon: 'clock',
            color: '#007AFF',
            targetDays: 7,
            minimumDuration: 15,
            consistency: 50,
          });
        }
      }
    };
    loadAnchor();
  }, [anchorId]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive, pulseAnim]);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleFinish = async () => {
    if (seconds === 0) {
      Alert.alert('Error', 'Session must be at least 1 second');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        setIsSaving(false);
        return;
      }

      // Atomic XP award + level recompute (single RPC round-trip).
      // This inserts the session, increments total_xp, and recomputes level
      // server-side so concurrent check-ins can't clobber XP.
      let result;
      try {
        result = await awardSessionXP({ anchorId, durationSeconds: seconds });
      } catch (rpcError) {
        console.error('awardSessionXP failed:', rpcError);
        Alert.alert('Error', 'Failed to save session. Please try again.');
        setIsSaving(false);
        return;
      }

      // Momentum depends on the current streak; update it after XP is banked.
      try {
        const streak = await getStreak();
        await updateMomentum({
          userId: user.id,
          durationSeconds: seconds,
          streak,
        });
      } catch (momentumError) {
        // Momentum is non-critical — don't fail the session for it.
        console.warn('Momentum update failed (non-fatal):', momentumError);
      }

      setSeconds(0);

      // Surface the level-up moment, otherwise a simple confirmation.
      if (result.leveledUp) {
        setLevelUpInfo({
          newLevel: result.newLevel,
          newRank: result.newRank,
          xpAwarded: result.xpAwarded,
          rankChanged: result.rankChanged,
        });
      } else {
        Alert.alert('Session Complete!', `+${result.xpAwarded} XP earned`, [
          { text: 'Nice', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      console.error('Session save error:', e);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        {/* Anchor Info */}
        <View style={styles.header}>
          <Text style={[styles.anchorTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {anchor?.title || 'Session'}
          </Text>
          <Text style={styles.anchorSubtitle}>Stay focused, you've got this</Text>
        </View>

        {/* Timer Display */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={[styles.timerText, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {formatTime(seconds)}
          </Text>
        </Animated.View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isActive ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
              <FontAwesome5 name="play" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Start Session</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                <FontAwesome5 name="pause" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
                onPress={handleFinish}
                disabled={isSaving}
              >
                <Text style={styles.finishButtonText}>
                  {isSaving ? 'Saving...' : 'Finish Session'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <LevelUpModal
        visible={levelUpInfo !== null}
        level={levelUpInfo?.newLevel ?? 0}
        rank={levelUpInfo?.newRank ?? ''}
        xpAwarded={levelUpInfo?.xpAwarded ?? 0}
        rankChanged={levelUpInfo?.rankChanged}
        onContinue={() => {
          setLevelUpInfo(null);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  anchorTitle: {
    ...typography.title,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  anchorSubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
  },
  timerContainer: {
    ...baseStyles.flexCenter,
    flex: 1,
  },
  timerText: {
    ...typography.title,
    fontSize: 64,
    fontWeight: '300',
  },
  controls: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: 30,
    gap: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  activeControls: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}20`,
    ...baseStyles.flexCenter,
  },
  finishButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 24,
    backgroundColor: colors.success,
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});