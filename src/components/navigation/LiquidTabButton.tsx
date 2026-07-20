import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, {
  useDerivedValue,
  useAnimatedStyle,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import { navigationTokens } from '../../constants/theme';

interface LiquidTabButtonProps {
  /** Route index (0..n) — matches position in the sliding indicator. */
  index: number;
  label: string;
  iconName: string;
  /** Shared, continuous tab position (drives every sub-animation). */
  progress: SharedValue<number>;
  onPress: () => void;
  /** Disable movement (scale/lift) when the user prefers reduced motion. */
  reduced: boolean;
}

/**
 * A single tab in the Liquid Glass nav.
 *
 * The active visual state is *derived* from the shared `progress` value, so a
 * tab change needs zero React re-renders — the icon crossfades gray → teal,
 * lifts slightly, and scales, while the label fades and recolors. The bead
 * that glides behind the active icon is positioned by the parent.
 */
export function LiquidTabButton({
  index,
  label,
  iconName,
  progress,
  onPress,
  reduced,
}: LiquidTabButtonProps) {
  const c = useThemeColors();
  const inactive = c.textMuted;
  const active = c.accent;

  // 1 when this tab is active, 0 when one slot away (linear falloff).
  const focus = useDerivedValue(() => {
    'worklet';
    const d = Math.abs(progress.value - index);
    return Math.max(0, 1 - d);
  });

  const iconStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    return {
      transform: [
        { scale: 1 + (navigationTokens.iconActiveScale - 1) * focus.value },
        { translateY: navigationTokens.iconActiveLift * focus.value },
      ],
    };
  });

  const activeIconStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const inactiveIconStyle = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.5 * focus.value,
    color: interpolateColor(focus.value, [0, 1], [inactive, active]),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.slot}
      hitSlop={10}
      accessibilityRole="tab"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
          <FontAwesome5 name={iconName as any} size={navigationTokens.iconSizeGlass} color={inactive} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, activeIconStyle]}>
          <FontAwesome5 name={iconName as any} size={navigationTokens.iconSizeGlass} color={active} />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
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
  // Icon is absolutely centered so the label (below it) never shifts it.
  iconWrap: {
    position: 'absolute',
    top: navigationTokens.capsuleHeight / 2 - navigationTokens.iconBlockOffset - navigationTokens.iconSizeGlass / 2,
    left: 0,
    right: 0,
    height: navigationTokens.iconSizeGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
  },
  label: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: navigationTokens.labelSizeGlass,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
