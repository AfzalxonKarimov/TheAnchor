import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner } from '../../constants/theme';

interface QuoteCardProps {
  /** Defaults to today; deterministic pick by day-of-year. */
  date?: Date;
  style?: ViewStyle;
}

const INSIGHTS = [
  { text: 'Show up today. The anchor holds even when the wave doesn’t.', by: 'TheAnchor' },
  { text: 'Consistency isn’t perfection — it’s returning after you break.', by: 'TheAnchor' },
  { text: 'A missed day is data, not a verdict. Begin again, gently.', by: 'TheAnchor' },
  { text: 'You don’t need motivation. You need a small, repeated yes.', by: 'TheAnchor' },
  { text: 'Momentum is built in the quiet returns no one sees.', by: 'TheAnchor' },
  { text: 'The days you don’t feel like it are the ones that count.', by: 'TheAnchor' },
  { text: 'Anchors don’t rush the tide. They simply stay.', by: 'TheAnchor' },
  { text: 'Progress is a curve, not a line. Trust the dip.', by: 'TheAnchor' },
];

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/** A daily insight card — deterministic per calendar day, no randomness. */
export function QuoteCard({ date, style }: QuoteCardProps) {
  const c = useThemeColors();
  const now = date ?? new Date();
  const item = INSIGHTS[dayOfYear(now) % INSIGHTS.length];

  return (
    <View
      style={[
        {
          borderRadius: corner.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          backgroundColor: c.surfaceAlt,
          borderWidth: 1,
          borderColor: c.hairline,
        },
        style,
      ]}
    >
      <FontAwesome5 name="quote-left" size={18} color={colors.primary} style={{ marginBottom: spacing.sm, opacity: 0.7 }} />
      <Text style={[typography.headingSm, { color: c.text, lineHeight: 26, fontWeight: '500' }]}>
        {item.text}
      </Text>
      <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.md, fontWeight: '600', letterSpacing: 0.6 }]}>
        {item.by.toUpperCase()}
      </Text>
    </View>
  );
}
