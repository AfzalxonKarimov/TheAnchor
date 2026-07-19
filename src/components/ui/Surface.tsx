import React, { useRef } from 'react';
import {
  View,
  ViewStyle,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../theme/useThemeColors';
import { corner, shadow, colors } from '../../constants/theme';

interface SurfaceProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Override background (e.g. a tint or gradient layer handles color). */
  tint?: string;
  /** Card radius preset. */
  radius?: keyof typeof corner;
  /** Use the stronger elevated shadow (on-press lift / floating). */
  elevated?: boolean;
  /** Render as a translucent glass surface. */
  glass?: boolean;
  /** Hairline border on/off. */
  bordered?: boolean;
  /** Make it pressable — lifts on touch with a soft haptic. */
  onPress?: () => void;
  testID?: string;
}

/**
 * The foundation card for the whole app. Layered soft shadow + hairline border +
 * generous radius. When `onPress` is provided it gently lifts (scale 0.985) and
 * fires a light haptic, so every card can feel alive.
 */
export function Surface({
  children,
  style,
  tint,
  radius = 'lg',
  elevated = false,
  glass = false,
  bordered = true,
  onPress,
  testID,
}: SurfaceProps) {
  const c = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.985,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 18,
      useNativeDriver: true,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const background = glass
    ? c.glass.backgroundColor
    : tint ?? c.surface;

  const borderColor = glass ? c.glass.borderColor : c.hairline;

  const base: ViewStyle = {
    backgroundColor: background,
    borderRadius: corner[radius],
    borderWidth: bordered ? 1 : 0,
    borderColor,
    ...(elevated ? shadow.elevate : shadow.soft),
  };

  const content = (
    <Animated.View
      style={[{ transform: [{ scale }] }, base, style]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }
  return content;
}
