import React from 'react';
import { View, Text, ViewStyle, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { typography, colors, spacing, corner } from '../../constants/theme';

interface SegmentedProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

/** iOS-style segmented control for theme / intensity pickers. */
export function Segmented({ options, value, onChange, style }: SegmentedProps) {
  const c = useThemeColors();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: c.surfaceAlt,
          borderRadius: corner.pill,
          padding: 4,
          gap: 4,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: corner.pill,
              backgroundColor: active ? c.surface : 'transparent',
              alignItems: 'center',
              ...(active ? shadowSoft() : {}),
            }}
          >
            <Text
              style={[
                typography.small,
                { fontWeight: active ? '700' : '500', color: active ? c.accentStrong : c.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function shadowSoft() {
  return {
    shadowColor: '#0B1413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  };
}
