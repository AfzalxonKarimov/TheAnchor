import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, LinearGradient, Stop, Defs } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { animation } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Use teal gradient stroke. */
  gradient?: boolean;
  /** Animate from 0 on mount. */
  animated?: boolean;
  /** Soft outer glow. */
  glow?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Circular progress ring with a gradient stroke and animated draw-on.
 * `react-native-svg` exposes `strokeDashoffset` as a non-native prop, so the
 * animation runs without `useNativeDriver` (required for SVG attributes).
 */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  trackColor,
  gradient = true,
  animated = true,
  glow = false,
  children,
  style,
}: ProgressRingProps) {
  const c = useThemeColors();
  const stroke = color ?? c.accent;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(1, progress));
  const uid = React.useId().replace(/:/g, '');
  const gradId = `ring-${uid}`;

  const anim = useRef(new Animated.Value(animated ? 0 : target)).current;
  const didInit = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Reduced motion or no animation: snap to the value, no draw-on.
    if (!animated || reduced) {
      anim.setValue(target);
      didInit.current = true;
      return;
    }
    if (!didInit.current) {
      // First appearance only — the 0→target draw-on should not replay every
      // time data refreshes (or, for the live session timer, every tick).
      didInit.current = true;
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: target,
        duration: 900,
        easing: ((t: number) => 1 - Math.pow(1 - t, 3)),
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(target);
    }
  }, [target, animated, anim, reduced]);

  const offset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - target)],
  });

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          {gradient && (
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={c.accentSoft} />
              <Stop offset="100%" stopColor={c.accentGlow} />
            </LinearGradient>
          )}
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? (c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,20,19,0.07)')}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Glow underlay */}
        {glow && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth + 8}
            fill="none"
            opacity={0.12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset as any}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient ? `url(#${gradId})` : stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset as any}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children != null && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {children}
        </View>
      )}
    </View>
  );
}
