import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated, Easing, StyleSheet } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { animation } from '../../constants/theme';

interface XPBarProps {
  /** 0..1 fill toward next level. */
  progress: number;
  height?: number;
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * Animated horizontal XP bar: gradient fill that draws on from 0 with a soft
 * glow, plus a slow shimmer sweep. Calm, not flashy.
 */
export function XPBar({ progress, height = 10, glow = true, style }: XPBarProps) {
  const c = useThemeColors();
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, progress));
  const fill = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, {
      toValue: target,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    shimmer.setValue(-1);
    // Perpetual shimmer fights the "calm/minimal" intent and ignores the
    // user's reduced-motion preference — only run it when motion is allowed.
    if (reduced) return;
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [target, fill, shimmer, reduced]);

  const width = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${target * 100}%`],
  });

  const shimmerX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-40%', '140%'],
  });

  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          overflow: 'hidden',
          backgroundColor: c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,20,19,0.07)',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            borderRadius: height / 2,
            backgroundColor: c.accent,
          },
          glow && {
            shadowColor: c.accentGlow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
          },
          { width },
        ]}
      >
        {/* Gradient sheen */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: height / 2,
            backgroundColor: c.accentSoft,
            opacity: 0.35,
          }}
        />
        {/* Shimmer sweep */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            transform: [{ translateX: shimmerX }],
            backgroundColor: 'rgba(255,255,255,0.22)',
          }}
        />
      </Animated.View>
    </View>
  );
}
