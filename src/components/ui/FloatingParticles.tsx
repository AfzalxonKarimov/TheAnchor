import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, ViewStyle } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';

interface FloatingParticlesProps {
  /** Increment to fire a new burst. */
  trigger?: number;
  count?: number;
  color?: string;
  style?: ViewStyle;
}

const TAU = Math.PI * 2;

/**
 * XP celebration burst — particles rise and fan outward, fading as they go.
 * Fires whenever `trigger` changes. Deterministic spread (no Math.random) so
 * it's stable across renders.
 */
export function FloatingParticles({ trigger = 0, count = 14, color, style }: FloatingParticlesProps) {
  const c = useThemeColors();
  const stroke = color ?? c.accentSoft;

  const particles = useRef(
    Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / (count - 1) - 0.5) * (Math.PI * 0.9);
      const dist = 70 + ((i * 37) % 60);
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 30,
        size: 6 + (i % 4) * 3,
        delay: (i % 5) * 40,
        duration: 900 + (i % 4) * 160,
      };
    })
  ).current;

  const anims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (trigger === 0) return;
    anims.forEach((a, i) => {
      a.setValue(0);
      Animated.timing(a, {
        toValue: 1,
        duration: particles[i].duration,
        delay: particles[i].delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, style]} pointerEvents="none">
      {anims.map((a, i) => {
        const p = particles[i];
        const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] });
        const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
        const opacity = a.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: stroke,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}
