import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, navigationTokens } from '../../constants/theme';
import { useThemeColors } from '../../theme/useThemeColors';

interface TabBarIconProps {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  focused: boolean;
  activeColor?: string;
}

/**
 * Animated tab bar icon. Active state gets a soft teal pill + spring scale,
 * inactive stays muted and calm. Keeps motion gentle (no overshoot bounce).
 */
export function TabBarIcon({ name, focused, activeColor }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.12 : 1,
      tension: 220,
      friction: 18,
      useNativeDriver: true,
    }).start();
    Animated.timing(pill, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focused, scaleAnim, pill]);

  const c = useThemeColors();
  const tint = activeColor || colors.primary;
  const color = focused ? tint : c.textMuted;
  const pillOpacity = pill.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const pillScale = pill.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={{ width: 56, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 44,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.primary}1F`,
          opacity: pillOpacity,
          transform: [{ scale: pillScale }],
        }}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <FontAwesome5
          name={name}
          size={focused ? navigationTokens.iconSizeActive : navigationTokens.iconSize}
          color={color}
        />
      </Animated.View>
    </View>
  );
}
