import React, { useState } from 'react';
import { View, Text, ViewStyle, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, spacing } from '../../constants/theme';

interface HeatmapProps {
  /** weeks[col][row], col = oldest -> newest, row = 0 (top) .. 6. */
  weeks: number[][];
  /** formatted date labels for tooltips, same shape as weeks. */
  dates?: string[][];
  /** month labels positioned at a column index. */
  monthLabels?: { col: number; label: string }[];
  style?: ViewStyle;
}

const CELL = 13;
const GAP = 4;

/** GitHub-style consistency heatmap with teal intensity scale + press tooltip. */
export function Heatmap({ weeks, dates, monthLabels = [], style }: HeatmapProps) {
  const c = useThemeColors();
  const [active, setActive] = useState<{ col: number; row: number } | null>(null);

  const max = Math.max(1, ...weeks.flat());
  const shade = (count: number) => {
    if (count <= 0) return c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,20,19,0.06)';
    const level = Math.ceil((count / max) * 4);
    const map = [c.accent, c.accent, c.accentSoft, c.accentSoft, '#99F6E4'];
    return map[Math.min(level, 4)] ?? c.accent;
  };

  const colW = CELL + GAP;

  return (
    <View style={style}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
        <View>
          {/* Month labels */}
          <View style={{ height: 16, flexDirection: 'row' }}>
            {weeks.map((_, col) => {
              const m = monthLabels.find((x) => x.col === col);
              return (
                <View key={col} style={{ width: colW, paddingLeft: 2 }}>
                  {m ? <Text style={[typography.caption, { color: c.textMuted, fontSize: 10 }]}>{m.label}</Text> : null}
                </View>
              );
            })}
          </View>
          {/* Grid */}
          <View style={{ flexDirection: 'row' }}>
            {weeks.map((week, col) => (
              <View key={col} style={{ marginRight: GAP }}>
                {week.map((count, row) => (
                  <TouchableWithoutFeedback
                    key={row}
                    onPress={() => setActive({ col, row })}
                    onPressOut={() => setActive(null)}
                  >
                    <View
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        backgroundColor: shade(count),
                        marginBottom: GAP,
                      }}
                    />
                  </TouchableWithoutFeedback>
                ))}
              </View>
            ))}
          </View>

          {/* Tooltip */}
          {active && (
            <View
              style={{
                position: 'absolute',
                top: 16 + active.row * colW - 30,
                left: active.col * colW,
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.hairline,
                borderRadius: 10,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                ...shadowSoft(),
              }}
            >
              <Text style={[typography.small, { color: c.text, fontWeight: '700' }]}>
                {weeks[active.col]?.[active.row] ?? 0} sessions
              </Text>
              {dates?.[active.col]?.[active.row] && (
                <Text style={[typography.caption, { color: c.textMuted }]}>{dates[active.col][active.row]}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.sm, gap: 4 }}>
        <Text style={[typography.caption, { color: c.textMuted }]}>Less</Text>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <View key={lvl} style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor: shade(lvl === 0 ? 0 : Math.ceil((lvl / 4) * max) || 1) }} />
        ))}
        <Text style={[typography.caption, { color: c.textMuted }]}>More</Text>
      </View>
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
