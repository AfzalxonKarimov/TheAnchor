import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, navigationTokens, animation } from '../../constants/theme';

interface TabBarIconProps {
  /** Icon name from FontAwesome5 */
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  /** Whether this tab is currently active */
  focused: boolean;
  /** Color to use when active (defaults to primary) */
  activeColor?: string;
}

/**
 * Animated tab bar icon component.
 *
 * Design decisions:
 * - Uses Animated.timing for smooth 60fps transitions
 * - Scales up slightly on focus to create subtle emphasis
 * - Fades color transition for premium feel
 * - No rotation/scale overshoot to keep it calm/minimal
 */
export function TabBarIcon({ name, focused, activeColor }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.4)).current;

  useEffect(() => {
    // Smooth scale animation on focus change
    Animated.timing(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      duration: animation.fast,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Smooth opacity fade for inactive state
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.4,
      duration: animation.fast,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim, opacityAnim]);

  const color = focused ? activeColor || colors.primary : colors.neutral[400];

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <FontAwesome5
        name={name}
        size={focused ? navigationTokens.iconSizeActive : navigationTokens.iconSize}
        color={color}
      />
    </Animated.View>
  );
}