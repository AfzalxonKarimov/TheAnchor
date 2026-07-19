import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type GlyphName =
  | 'anchor'
  | 'mountain'
  | 'compass'
  | 'torch'
  | 'shield'
  | 'northstar'
  | 'lightning'
  | 'flame'
  | 'star'
  | 'clock'
  | 'hourglass'
  | 'trophy'
  | 'check'
  | 'calendar';

interface GlyphProps {
  name: GlyphName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Custom monoline icon language for TheAnchor's achievement system —
 * drawn from the brand vocabulary (anchor, mountain, compass, torch,
 * shield, north star, lightning). One consistent 1.8px stroke, rounded
 * joins, 24×24 viewBox. Avoids generic icon packs so the gallery reads
 * as a single, intentional system.
 */
export function AchievementGlyph({ name, size = 22, color = '#2DD4BF', strokeWidth = 1.8 }: GlyphProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {GLYPHS[name](common)}
    </Svg>
  );
}

type Draw = (c: any) => React.ReactNode;

const GLYPHS: Record<GlyphName, Draw> = {
  anchor: (c) => (
    <>
      <Circle cx={12} cy={5} r={2.4} {...c} />
      <Path d="M12 7.4 V20" {...c} />
      <Path d="M5 11 H19" {...c} />
      <Path d="M12 20 c-3.2 0-5.4-2.2-5.4-5.2" {...c} />
      <Path d="M12 20 c3.2 0 5.4-2.2 5.4-5.2" {...c} />
    </>
  ),
  mountain: (c) => (
    <>
      <Circle cx={17.5} cy={6} r={1.8} {...c} />
      <Path d="M3 19 L9 9 L13 15 L16 11 L21 19 Z" {...c} />
    </>
  ),
  compass: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} {...c} />
      <Path d="M15.6 8.4 L12 12 L8.4 15.6 L12 12 Z" {...c} />
      <Circle cx={12} cy={12} r={1.1} {...c} />
    </>
  ),
  torch: (c) => (
    <>
      <Path d="M10 3.5 H14 L13.2 8 H10.8 Z" {...c} />
      <Path d="M10.8 8 H13.2 V19 H10.8 Z" {...c} />
      <Path d="M12 1 V3" {...c} />
      <Path d="M9 1.6 L10 3.4" {...c} />
      <Path d="M15 1.6 L14 3.4" {...c} />
      <Path d="M9 19 H15" {...c} />
    </>
  ),
  shield: (c) => (
    <Path d="M12 3 L19 6 V11 C19 15 16 18 12 20.5 C8 18 5 15 5 11 V6 Z" {...c} />
  ),
  northstar: (c) => (
    <Path d="M12 2.5 C12 8.5 13 12 21 12 C13 12 12 15.5 12 21.5 C12 15.5 11 12 3 12 C11 12 12 8.5 12 2.5 Z" {...c} />
  ),
  lightning: (c) => (
    <Path d="M13 2 L5 13 H10.5 L10 22 L19 10 H13.2 Z" {...c} />
  ),
  flame: (c) => (
    <>
      <Path d="M12 3 C14.5 7 17 9 17 13 C17 17 14.6 20 12 21 C9.4 20 7 17 7 13 C7 10 9 8 12 3 Z" {...c} />
      <Path d="M12 15.5 C13.6 13.6 14 12 14 10.6 C13 11.6 12 12 12 13.8 C12 12 11 11.6 10 10.6 C10 12 10.4 13.6 12 15.5 Z" {...c} />
    </>
  ),
  star: (c) => (
    <Path d="M12 3 L14.8 9.3 L21.5 10.2 L16.5 14.8 L17.8 21.5 L12 18 L6.2 21.5 L7.5 14.8 L2.5 10.2 L9.2 9.3 Z" {...c} />
  ),
  clock: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} {...c} />
      <Path d="M12 7 V12 L15.2 14" {...c} />
    </>
  ),
  hourglass: (c) => (
    <>
      <Path d="M7 4 H17" {...c} />
      <Path d="M7 20 H17" {...c} />
      <Path d="M8.2 4 C8.2 9.5 15.8 9.5 15.8 12 C15.8 14.5 8.2 14.5 8.2 20" {...c} />
      <Path d="M15.8 4 C15.8 9.5 8.2 9.5 8.2 12 C8.2 14.5 15.8 14.5 15.8 20" {...c} />
    </>
  ),
  trophy: (c) => (
    <>
      <Path d="M8 4 H16 V11 C16 14 14.2 16 12 16 C9.8 16 8 14 8 11 Z" {...c} />
      <Path d="M8 5.2 H5 V9 C5 10.2 6 11.2 8 11.2" {...c} />
      <Path d="M16 5.2 H19 V9 C19 10.2 18 11.2 16 11.2" {...c} />
      <Path d="M10 16 H14" {...c} />
      <Path d="M9 20 H15" {...c} />
      <Path d="M11 16 V20 M13 16 V20" {...c} />
    </>
  ),
  check: (c) => <Path d="M5 12.5 L10 17.5 L19 6.5" {...c} />,
  calendar: (c) => (
    <>
      <Rect x={4} y={5} width={16} height={16} rx={2.5} {...c} />
      <Path d="M4 9.5 H20" {...c} />
      <Path d="M8 3 V6 M16 3 V6" {...c} />
    </>
  ),
};
