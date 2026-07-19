import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';

interface BreathingPulseProps {
  size?: number;
  color?: string;
  rings?: number;
  style?: ViewStyle;
}

/**
 * Ambient breathing rings for the immersive check-in background.
 * Concentric circles scale up + fade out on a slow loop — calm, not busy.
 */
export function BreathingPulse({ size = 240, color, rings = 3, style }: BreathingPulseProps) {
  const c = useThemeColors();
  const stroke = color ?? c.accent;
  const anims = useRef(
    Array.from({ length: rings }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const timers = anims.map((a, i) => {
      const start = () => {
        a.setValue(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(a, {
              toValue: 1,
              duration: 3200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
              delay: i * 700,
            }),
            Animated.timing(a, { toValue: 1, duration: 0, useNativeDriver: true }),
          ])
        ).start();
      };
      const t = setTimeout(start, i * 700);
      return t;
    });
    return () => timers.forEach(clearTimeout);
  }, [anims]);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {anims.map((a, i) => {
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] });
        const opacity = a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.32, 0.12, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1.5,
              borderColor: stroke,
              opacity,
              transform: [{ scale }],
            }}
          />
        );
      })}
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: (size * 0.5) / 2,
          backgroundColor: stroke,
          opacity: 0.1,
        }}
      />
    </View>
  );
}
