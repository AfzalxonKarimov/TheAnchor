import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Platform,
  Text,
  View,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, navigationTokens, spacing, typography } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingActionButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is disabled (e.g., loading state) */
  disabled?: boolean;
  /** Optional text label. When provided, renders an extended pill (icon + label)
   * instead of a bare circular button, making the action self-explanatory. */
  label?: string;
  /** When true, all anchors for today are already checked in — render a muted,
   * celebratory "done" state instead of the active call-to-action. */
  done?: boolean;
}

/**
 * Floating Action Button for initiating anchor sessions.
 *
 * Design decisions:
 * - Pill shape with icon + label for a clear, self-explanatory call to action.
 * - Uses FontAwesome5 (the app's standard icon set) with a `check` glyph so the
 *   action reads as a "check-in", not a generic play.
 * - Elevated with a subtle shadow to float above the navigation bar.
 * - Gentle pulse glow on mount to invite interaction without being distracting.
 * - Haptic feedback on press for tactile response.
 * - Larger hit area than the visual size for accessibility.
 * - When `done` is set, the button flips to a muted/completed look (success tint
 *   or neutral) so an "all done for today" state is obvious rather than a dead tap.
 */
export function FloatingActionButton({ onPress, disabled, label, done }: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  // Pulsing animation on mount - subtle glow to invite interaction.
  // Skipped when `done` (settled state) or when the user prefers reduced motion.
  useEffect(() => {
    if (done || reduced) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    // Cleanup animation on unmount
    return () => pulse.stop();
  }, [pulseAnim, done]);

  const handlePress = async () => {
    // Visual press feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback for tactile response — a lighter tap when already done.
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Silently fail - haptics not available on all devices
      }
    }

    // `done` is purely a visual state; the press still fires so the parent can
    // give feedback (e.g. navigate Home) instead of swallowing the tap.
    if (disabled) return;
    onPress();
  };

  // Interpolate pulse animation for glow effect
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  // Resolve visual treatment based on state.
  const showLabel = !!label;
  const backgroundColor = done ? colors.success : colors.primary;
  const iconName = done ? 'check-circle' : 'check';
  const iconSize = showLabel ? 18 : 28;

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={{
          width: showLabel ? undefined : navigationTokens.floatingButtonSize,
          height: navigationTokens.floatingButtonSize,
          paddingHorizontal: showLabel ? spacing.xl : 0,
          borderRadius: navigationTokens.floatingButtonSize / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          transform: [{ scale: scaleAnim }],
          // Elevation above tab bar — present but quiet
          elevation: 4,
          shadowColor: '#050807',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: done ? 0.08 : 0.1,
          shadowRadius: 10,
          opacity: disabled ? 0.5 : 1,
          // Larger hit area for accessibility
          marginLeft: showLabel ? 0 : -10, // Offset to center between tab bar items when circular
        }}
      >
        {/* Subtle pulse glow behind button */}
        {!done && (
          <Animated.View
            style={{
              position: 'absolute',
              width: showLabel
                ? navigationTokens.floatingButtonSize + 40
                : navigationTokens.floatingButtonSize + 8,
              height: navigationTokens.floatingButtonSize + 8,
              borderRadius: (navigationTokens.floatingButtonSize + 8) / 2,
              backgroundColor,
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            }}
          />
        )}

        {/* Soft top sheen for a gradient feel */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: (showLabel ? navigationTokens.floatingButtonSize : navigationTokens.floatingButtonSize) / 2,
            borderRadius: showLabel ? navigationTokens.floatingButtonSize / 2 : navigationTokens.floatingButtonSize / 2,
            backgroundColor: 'rgba(255,255,255,0.16)',
          }}
        />

        <FontAwesome5
          name={iconName as any}
          size={iconSize}
          color={colors.onAccent}
          style={showLabel ? { marginRight: spacing.sm } : { marginLeft: 2 }} // Visual centering adjustment
        />
        {showLabel ? (
          <Text style={{ ...typography.bodyMd, color: '#FFFFFF', fontWeight: '600' }}>
            {done ? 'All done' : label}
          </Text>
        ) : null}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
