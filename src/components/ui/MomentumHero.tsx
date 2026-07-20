import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Path as SvgPath } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner, shadow } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { smoothLine } from '../../lib/smooth';
import { AreaChart } from './AreaChart';

export type MomentumStatus = 'recovering' | 'on_track' | 'strong';

interface MomentumHeroProps {
  momentum: number; // 0..100
  trend: number[]; // weekly activity counts
  status?: MomentumStatus;
  subLine?: string;
  /** Change since yesterday (start-of-today baseline). */
  delta?: number;
  style?: ViewStyle;
}

const STATUS_META: Record<MomentumStatus, { label: string; tint: string }> = {
  recovering: { label: 'Recovering', tint: colors.warning },
  on_track: { label: 'On track', tint: colors.primary },
  strong: { label: 'Strong', tint: colors.success },
};

/** Home hero: large animated momentum number, status pill, full-width trend. */
export function MomentumHero({ momentum, trend, status = 'on_track', subLine, delta = 0, style }: MomentumHeroProps) {
  const c = useThemeColors();
  const meta = STATUS_META[status];
  const reduced = useReducedMotion();

  // Smooth count-up using rAF timestamps (no Date.now needed).
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const countedRef = useRef(false);
  useEffect(() => {
    const target = Math.round(momentum);
    // Reduced-motion users (and subsequent refreshes) snap instantly — no replay.
    if (reduced || countedRef.current) {
      setDisplay(target);
      countedRef.current = true;
      return;
    }
    if (target === 0) {
      setDisplay(0);
      countedRef.current = true;
      return;
    }
    countedRef.current = true;
    const start = 0;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (startTime == null) startTime = ts;
      const t = Math.min((ts - startTime) / 900, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [momentum, reduced]);

  // Wide sparkline behind the number for depth (Apple Stocks feel).
  const sw = 220;
  const sh = 56;
  const max = Math.max(1, ...trend);
  const sparkPts = trend.length
    ? trend.map((v, i) => {
        const x = trend.length === 1 ? sw / 2 : (i / (trend.length - 1)) * sw;
        const y = sh - (v / max) * (sh - 8) - 4;
        return { x, y };
      })
    : [];
  const sparkPath = smoothLine(sparkPts);

  const deltaTint = delta > 0 ? colors.success : delta < 0 ? colors.warning : c.textMuted;
  const deltaIcon = delta > 0 ? 'arrow-up' : delta < 0 ? 'arrow-down' : 'minus';
  const deltaLabel =
    delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : 'steady';

  return (
    <View
      accessibilityLabel={`Momentum ${display} out of 100, ${meta.label}`}
      style={[
        {
          borderRadius: corner.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.xl,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.hairline,
          ...shadow.soft,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Ambient sparkline wash */}
      {sparkPath ? (
        <Svg width={sw} height={sh} style={{ position: 'absolute', top: -8, right: -8, opacity: 0.5 }}>
          <Defs>
            <LinearGradient id="mhero-wash" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={c.accentSoft} stopOpacity={0.06} />
              <Stop offset="100%" stopColor={c.accentGlow} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          <SvgPath d={sparkPath} fill="none" stroke="url(#mhero-wash)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={[typography.eyebrow, { color: c.textMuted }]}>MOMENTUM</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs }}>
            <Text style={[typography.displayLg, { color: c.text }]}>{display}</Text>
            <Text style={[typography.heading, { color: c.textMuted, marginLeft: spacing.xs }]}>/100</Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: corner.pill,
            backgroundColor: `${meta.tint}1F`,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: meta.tint }} />
          <Text style={[typography.caption, { color: c.text, fontWeight: '700', letterSpacing: 0.4 }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* Full-width trend chart — kept compact so the momentum number
          stays the hero of the card. */}
      <View style={{ marginTop: spacing.lg }}>
        <AreaChart data={trend} height={104} formatValue={(v) => `${v} sessions`} />
      </View>

      {/* Delta + encouraging line */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: corner.pill,
            backgroundColor: delta !== 0 ? `${deltaTint}1F` : c.surfaceAlt,
          }}
        >
          <FontAwesome5 name={deltaIcon as any} size={11} color={deltaTint} />
          <Text style={[typography.caption, { color: c.text, fontWeight: '700' }]}>
            {deltaLabel} {delta !== 0 ? 'vs yesterday' : 'today'}
          </Text>
        </View>
      </View>

      {subLine && (
        <Text style={[typography.small, { color: c.textMuted, marginTop: spacing.sm, lineHeight: 20 }]}>{subLine}</Text>
      )}
    </View>
  );
}
