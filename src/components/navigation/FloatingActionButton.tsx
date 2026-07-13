import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Platform,
  Text,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, navigationTokens, animation } from '../../constants/theme';

interface FloatingActionButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is disabled (e.g., loading state) */
  disabled?: boolean;
  /** Optional text label. When provided, renders an extended pill (icon + label)
   * instead of a bare circular button, making the action self-explanatory. */
  label?: string;
}

/**
 * Floating Action Button for initiating anchor sessions.
 *
 * Design decisions:
 * - Circular shape for clear hierarchy (different from tab bar items)
 * - Elevated with subtle shadow to float above navigation bar
 * - Pulse animation on mount to draw attention without being distracting
 * - Haptic feedback on press for tactile response
 * - Larger hit area (74x74) for accessibility while visually 64x64
 * - When `label` is set, expands into a pill with an explanatory caption
 */
export function FloatingActionButton({ onPress, disabled, label }: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulsing animation on mount - subtle glow to invite interaction
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    // Cleanup animation on unmount
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = async () => {
    // Visual press feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback for tactile response
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Silently fail - haptics not available on all devices
      }
    }

    // Call the original handler
    if (!disabled) {
      onPress();
    }
  };

  // Interpolate pulse animation for glow effect
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={{
          width: label ? undefined : navigationTokens.floatingButtonSize,
          height: navigationTokens.floatingButtonSize,
          paddingHorizontal: label ? 20 : 0,
          borderRadius: navigationTokens.floatingButtonSize / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          transform: [{ scale: scaleAnim }],
          // Elevation above tab bar - subtle shadow
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          // Larger hit area for accessibility
          marginLeft: label ? 0 : -10, // Offset to center between tab bar items when circular
        }}
      >
        {/* Subtle pulse glow behind button */}
        <Animated.View
          style={{
            position: 'absolute',
            width: label
              ? navigationTokens.floatingButtonSize + 40
              : navigationTokens.floatingButtonSize + 8,
            height: navigationTokens.floatingButtonSize + 8,
            borderRadius: (navigationTokens.floatingButtonSize + 8) / 2,
            backgroundColor: colors.primary,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }}
        />

        <FontAwesome
          name="play"
          size={label ? 18 : 28}
          color="#FFFFFF"
          style={label ? { marginRight: 8 } : { marginLeft: 2 }} // Visual centering adjustment
        />
        {label ? (
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}