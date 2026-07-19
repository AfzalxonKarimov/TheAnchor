import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ViewStyle, Animated, Easing, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Polyline, LinearGradient, Stop, Defs, Line, Circle as SvgCircle } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);
import { useThemeColors } from '../../theme/useThemeColors';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { typography, colors, spacing } from '../../constants/theme';
import { smoothLine, smoothArea, pathLength } from '../../lib/smooth';

interface AreaChartProps {
  data: number[]; // oldest -> newest
  labels?: string[]; // one per point (e.g. week start)
  height?: number;
  formatValue?: (v: number) => string;
  formatLabel?: (i: number) => string;
  style?: ViewStyle;
}

/** Interactive XP/activity area chart — gradient fill, draw-on animation, press tooltip. */
export function AreaChart({ data, labels, height = 150, formatValue, formatLabel, style }: AreaChartProps) {
  const c = useThemeColors();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const reveal = useRef(new Animated.Value(0)).current;
  const revealedRef = useRef(false);

  useEffect(() => {
    // Draw-on once on first appearance; snap (or skip) on later refreshes and
    // when the user prefers reduced motion.
    if (revealedRef.current || reduced) {
      reveal.setValue(1);
      return;
    }
    revealedRef.current = true;
    Animated.timing(reveal, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [reveal, data, reduced]);

  const padX = 8;
  const padTop = 12;
  const baseline = height - 18;

  const n = data.length;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => {
    const x = n <= 1 ? w / 2 : padX + (i / (n - 1)) * (w - padX * 2);
    const y = baseline - (v / max) * (baseline - padTop);
    return { x, y, v };
  });

  const lineStr = smoothLine(pts);
  const areaStr = smoothArea(pts, baseline);
  const pathLen = pathLength(pts);

  const dashOffset = reveal.interpolate({ inputRange: [0, 1], outputRange: [pathLen, 0] });
  const areaOpacity = reveal;

  const onTouch = (e: any) => {
    if (!w || n === 0) return;
    const x = e.nativeEvent.locationX;
    const idx = Math.round(((x - padX) / (w - padX * 2)) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, idx)));
  };

  const activeP = active != null ? pts[active] : null;

  return (
    <View
      style={[{ width: '100%' }, style]}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      onTouchStart={onTouch}
      onTouchMove={onTouch}
      onTouchEnd={() => setActive(null)}
    >
      {w > 0 && (
        <Svg width={w} height={height} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id="area-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={c.accent} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={c.accent} stopOpacity={0.02} />
            </LinearGradient>
            <LinearGradient id="area-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={c.accentSoft} />
              <Stop offset="100%" stopColor={c.accentGlow} />
            </LinearGradient>
          </Defs>
          {areaStr ? (
            <AnimatedPath d={areaStr} fill="url(#area-fill)" opacity={areaOpacity} />
          ) : null}
          {pts.length > 1 && (
            <AnimatedPath
              d={lineStr}
              fill="none"
              stroke="url(#area-line)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={dashOffset}
            />
          )}
          {activeP && (
            <>
              <Line x1={activeP.x} y1={padTop} x2={activeP.x} y2={baseline} stroke={c.textMuted} strokeWidth={1} strokeDasharray="3,3" />
              <SvgCircle cx={activeP.x} cy={activeP.y} r={5} fill={c.accent} stroke={c.background} strokeWidth={2} />
            </>
          )}
        </Svg>
      )}

      {activeP && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            left: Math.min(Math.max(activeP.x - 36, 0), Math.max(w - 72, 0)),
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.hairline,
            borderRadius: 12,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            alignItems: 'center',
            ...shadowSoft(),
          }}
        >
          <Text style={[typography.small, { color: c.text, fontWeight: '700' }]}>
            {formatValue ? formatValue(activeP.v) : activeP.v}
          </Text>
          {formatLabel && (
            <Text style={[typography.caption, { color: c.textMuted }]}>{formatLabel(active ?? 0)}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function shadowSoft() {
  return {
    shadowColor: '#0B1413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  };
}
