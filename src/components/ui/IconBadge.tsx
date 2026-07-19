import React from 'react';
import { View, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, corner } from '../../constants/theme';

interface IconBadgeProps {
  name: string;
  color?: string;
  size?: number;
  /** Container size. */
  box?: number;
  style?: ViewStyle;
}

/**
 * Soft circular icon background — the signature "soft icon" treatment.
 * Uses the tint `${color}1F` behind a colored glyph.
 */
export function IconBadge({
  name,
  color = colors.primary,
  size = 20,
  box = 44,
  style,
}: IconBadgeProps) {
  return (
    <View
      style={[
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: `${color}1F`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <FontAwesome5 name={name as any} size={size} color={color} />
    </View>
  );
}
