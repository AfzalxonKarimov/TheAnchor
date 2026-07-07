import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useColorScheme,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, animation, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';

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
 * - Minimal controls (Start/Pause/Stop)
 * - Progress ring visualization
 * - Haptic feedback on session events
 */
export default function SessionScreen({ route, navigation }: SessionScreenProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [duration, setDuration] = useState(15 * 60); // Default to 15 minutes
  const [remaining, setRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation for pulse effect when timer is active
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, [pulseAnim]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
    } else if (remaining === 0 && isActive) {
      setIsActive(false);
      setIsCompleted(true);
    }
    return () => clearInterval(interval);
  }, [isActive, remaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setRemaining(duration);
    navigation.goBack();
  };

  const progress = (duration - remaining) / duration;

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
          <View style={[styles.progressRing, { borderColor: `${colors.primary}20` }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: `${colors.primary}10`,
                  height: `${(1 - progress) * 100}%`,
                },
              ]}
            />
            <Text style={[styles.timerText, { color: isDark ? colors.dark.text : colors.light.text }]}>
              {formatTime(remaining)}
            </Text>
          </View>
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
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <FontAwesome5 name="stop" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
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
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    ...baseStyles.flexCenter,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  timerText: {
    ...typography.title,
    fontSize: 48,
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
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error,
    ...baseStyles.flexCenter,
  },
});