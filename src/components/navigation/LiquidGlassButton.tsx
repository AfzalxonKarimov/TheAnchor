import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import { GlassSurface } from './GlassSurface';
import { liquidGlass, navigationTokens } from '../../constants/theme';

interface LiquidGlassButtonProps {
  onPress: () => void;
  /** All anchors already checked in today — render a muted, celebratory state. */
  done?: boolean;
  /** Disable movement (press scale) when the user prefers reduced motion. */
  reduced: boolean;
}

/**
 * Crowned center check-in button — an elegant circular glass control that is
 * integrated into the nav but reads as slightly elevated.
 *
 *  - circular liquid-glass body (translucent tint + crisp sheen + 1px edge)
 *  - soft brand-colored glow + diffuse shadow for gentle elevation
 *  - press: scale 1 → 0.95, then a quiet spring back to 1
 *  - very soft haptic tap (lighter when already done)
 */
export function LiquidGlassButton({ onPress, done = false, reduced }: LiquidGlassButtonProps) {
  const c = useThemeColors();
  const g = c.isDark ? liquidGlass.dark : liquidGlass.light;
  const scale = useSharedValue(1);
  const size = navigationTokens.centerButtonSize;

  const animateTo = (to: number) => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withSpring(to, navigationTokens.pressSpring);
  };

  const handlePressIn = () => animateTo(0.95);
  const handlePressOut = () => animateTo(1);

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(done ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Haptics unavailable — non-fatal.
      }
    }
    onPress();
  };

  const fill = done ? c.success : g.centerFill;
  const iconName = done ? 'check-circle' : 'check';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      hitSlop={12}
      style={styles.slot}
      accessibilityRole="button"
      accessibilityLabel={done ? 'All anchors checked in' : 'Check in'}
    >
      <Animated.View style={[styles.wrap, animatedStyle]}>
        <GlassSurface
          circular
          blur={false}
          fillOverride={fill}
          borderOverride={g.centerBorder}
          shadowColorOverride={fill}
          shadowOpacityOverride={done ? 0.22 : 0.3}
          shadowRadiusOverride={16}
          sheenBoost={1.15}
          style={styles.button}
        >
          <FontAwesome5 name={iconName as any} size={22} color={c.onAccent} />
        </GlassSurface>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    height: navigationTokens.capsuleHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    // Crowned above the capsule by the parent; no inner offset needed here.
  },
  button: {
    width: navigationTokens.centerButtonSize,
    height: navigationTokens.centerButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
