import React, { useEffect, useRef } from 'react';
import { View, Text, ViewStyle, Animated, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; onPress: () => void };
  tint?: string;
  style?: ViewStyle;
}

/** Delightful empty state — animated icon badge, clear copy, optional CTA. */
export function EmptyState({ icon, title, subtitle, cta, tint = colors.primary, style }: EmptyStateProps) {
  const c = useThemeColors();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 120, friction: 14, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        { alignItems: 'center', paddingVertical: spacing.xxxxl, paddingHorizontal: spacing.xxl, opacity },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: `${tint}1A`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
          transform: [{ scale }],
        }}
      >
        <FontAwesome5 name={icon as any} size={40} color={tint} />
      </Animated.View>
      <Text style={[typography.heading, { color: c.text, textAlign: 'center', marginBottom: spacing.sm }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[typography.body, { color: c.textMuted, textAlign: 'center', lineHeight: 22 }]}>
          {subtitle}
        </Text>
      )}
      {cta && (
        <TouchableOpacity
          onPress={cta.onPress}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tint,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.xl,
            borderRadius: corner.pill,
            marginTop: spacing.xxl,
          }}
        >
          <FontAwesome5 name="plus" size={14} color={colors.onAccent} style={{ marginRight: spacing.sm }} />
          <Text style={{ ...typography.bodyMd, color: colors.onAccent, fontWeight: '700' }}>{cta.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
