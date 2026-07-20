import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner } from '../../constants/theme';
import { AchievementGlyph, GlyphName } from './AchievementGlyph';

interface AchievementBadgeProps {
  glyph: GlyphName;
  title: string;
  unlocked: boolean;
  /** 0..1 completion (reserved for a future progress bar). */
  progress?: number;
  /** current / target counts for the "5 / 7" caption. */
  current?: number;
  target?: number;
  /** Hidden identity until earned. */
  secret?: boolean;
  /** Short flavor line (optional; unused while locked + secret). */
  desc?: string;
  tint?: string;
  size?: number;
  style?: ViewStyle;
}

/** Achievement tile for the gallery — unlocked glows, locked is muted,
 *  secret (locked) shows a "?" mystery tile. */
export function AchievementBadge({
  glyph,
  title,
  unlocked,
  progress = 0,
  current,
  target,
  secret = false,
  tint = colors.primary,
  size = 56,
  style,
}: AchievementBadgeProps) {
  const c = useThemeColors();
  const isMystery = secret && !unlocked;
  const showCount = !isMystery && target != null && target > 1;
  return (
    <View style={[{ alignItems: 'center', width: size + 24, gap: spacing.md }, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: unlocked ? `${tint}1F` : c.surfaceAlt,
          borderWidth: 1,
          borderColor: unlocked ? 'transparent' : c.hairline,
          ...(unlocked ? glowSoft() : {}),
        }}
      >
        {isMystery ? (
          <Text style={{ fontSize: size * 0.42, color: c.textMuted, fontWeight: '700' }}>?</Text>
        ) : (
          <AchievementGlyph name={glyph} size={size * 0.42} color={unlocked ? tint : c.textMuted} />
        )}
        {unlocked && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: size * 0.17,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: c.background,
            }}
          >
            <AchievementGlyph name="check" size={size * 0.18} color="#fff" />
          </View>
        )}
      </View>
      {isMystery ? (
        <Text style={[typography.caption, { color: c.textMuted, fontWeight: '600', textAlign: 'center' }]}>???</Text>
      ) : (
        <Text style={[typography.caption, { color: unlocked ? c.text : c.textMuted, fontWeight: '600', textAlign: 'center' }]}>
          {title}
        </Text>
      )}
      {/* Progress count for multi-step achievements, e.g. "5 / 7". */}
      {showCount && (
        <Text style={[typography.micro, { color: c.textMuted, textAlign: 'center' }]}>
          {Math.min(current ?? 0, target as number)} / {target as number}
        </Text>
      )}
    </View>
  );
}

function glowSoft() {
  return {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 5,
  };
}
