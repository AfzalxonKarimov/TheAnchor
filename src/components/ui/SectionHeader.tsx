import React from 'react';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

/** Title + optional trailing action, used to open each screen section. */
export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  const c = useThemeColors();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      <View>
        <Text style={[typography.heading, { color: c.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[typography.small, { color: c.textMuted, marginTop: spacing.xs }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={[typography.small, { color: colors.primaryStrong, fontWeight: '600' }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
