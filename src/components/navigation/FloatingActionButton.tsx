import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, navigationTokens, animation } from '../../constants/theme';

interface FloatingActionButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is disabled (e.g., loading state) */
  disabled?: boolean;
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
 */
export function FloatingActionButton({ onPress, disabled }: FloatingActionButtonProps) {
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
          width: navigationTokens.floatingButtonSize,
          height: navigationTokens.floatingButtonSize,
          borderRadius: navigationTokens.floatingButtonSize / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
          // Elevation above tab bar - subtle shadow
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          // Larger hit area for accessibility
          marginLeft: -10, // Offset to center between tab bar items
        }}
      >
        {/* Subtle pulse glow behind button */}
        <Animated.View
          style={{
            position: 'absolute',
            width: navigationTokens.floatingButtonSize + 8,
            height: navigationTokens.floatingButtonSize + 8,
            borderRadius: (navigationTokens.floatingButtonSize + 8) / 2,
            backgroundColor: colors.primary,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }}
        />

        <FontAwesome
          name="play"
          size={28}
          color="#FFFFFF"
          style={{ marginLeft: 2 }} // Visual centering adjustment
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}