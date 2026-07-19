import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated } from 'react-native';
import { animation } from '../../constants/theme';

interface RevealProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Stagger delay in ms. */
  delay?: number;
  /** Initial vertical offset. */
  distance?: number;
  /** Re-run the entrance when this key changes (e.g. on focus). */
  trigger?: any;
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
}: RevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    opacity.setValue(0);
    translate.setValue(distance);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: animation.slow,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: animation.slow,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY: translate }] }]}
    >
      {children}
    </Animated.View>
  );
}
