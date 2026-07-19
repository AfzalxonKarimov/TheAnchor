import React from 'react';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner } from '../../constants/theme';
import { IconBadge } from './IconBadge';

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: string;
  tint?: string;
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

/** A premium stat tile — soft icon, big value, muted label. */
export function StatTile({ label, value, icon, tint = colors.primary, onPress, style, compact }: StatTileProps) {
  const c = useThemeColors();
  const pad = compact ? spacing.lg : spacing.xl;
  const Inner = (
    <View
      style={[
        {
          borderRadius: corner.lg,
          padding: pad,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.hairline,
        },
        style,
      ]}
    >
      {icon && (
        <IconBadge name={icon} color={tint} box={compact ? 34 : 40} size={compact ? 15 : 18} style={{ marginBottom: spacing.md }} />
      )}
      <Text style={[typography.display, { fontSize: compact ? 26 : 30, color: c.text, lineHeight: compact ? 30 : 34 }]}>
        {value}
      </Text>
      <Text style={[typography.caption, { color: c.textMuted, marginTop: 2, fontWeight: '600', letterSpacing: 0.4 }]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }} onPress={onPress}>
        {Inner}
      </TouchableOpacity>
    );
  }
  return <View style={{ flex: 1 }}>{Inner}</View>;
}

interface StatPillProps {
  label: string;
  value: string | number;
  icon?: string;
  tint?: string;
  style?: ViewStyle;
}

/** Inline compact stat used inside rows / summaries. */
export function StatPill({ label, value, icon, tint = colors.primary, style }: StatPillProps) {
  const c = useThemeColors();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]}>
      {icon && <IconBadge name={icon} color={tint} box={28} size={12} />}
      <View>
        <Text style={[typography.small, { color: c.text, fontWeight: '700' }]}>{value}</Text>
        <Text style={[typography.caption, { color: c.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}
