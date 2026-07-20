import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated, Easing } from 'react-native';
import { animation } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface RevealProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Stagger delay in ms. */
  delay?: number;
  /** Initial vertical offset. */
  distance?: number;
  /** Re-run the entrance when this key changes (e.g. on focus). */
  trigger?: any;
  /** Easing curve. Defaults to React Native's built-in timing ease. */
  easing?: (value: number) => number;
  /** Animation duration in ms. Defaults to `animation.slow`. */
  duration?: number;
}

/**
 * Lightweight fade + rise-in wrapper for staggered scroll reveals.
 * Keeps motion calm: short translate, gentle ease-out.
 */
export function Reveal({
  children,
  style,
  delay = 0,
  distance = 16,
  trigger,
  easing,
  duration = animation.slow,
}: RevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(distance)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      translate.setValue(0);
      scale.setValue(1);
      return;
    }
    opacity.setValue(0);
    translate.setValue(distance);
    scale.setValue(0.98);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduced]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY: translate }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}
