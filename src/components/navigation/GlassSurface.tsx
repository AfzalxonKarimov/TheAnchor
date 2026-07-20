import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { liquidGlass, navigationTokens } from '../../constants/theme';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  /** Outer container style (size, margins, flex). */
  style?: StyleProp<ViewStyle>;
  /** Force a perfect circle (radius = half of min dimension). */
  circular?: boolean;
  /** Override the corner radius (px). */
  radius?: number;
  /** Render the blur layer. Skip for cheap inner beads / opaque buttons. */
  blur?: boolean;
  /** Multiplier on the top sheen strength (1 = default). */
  sheenBoost?: number;
  /** Override the translucent fill (defaults to the theme tint). */
  fillOverride?: string;
  /** Override the 1px outer border color. */
  borderOverride?: string;
  /** Override the drop-shadow color (e.g. brand glow). */
  shadowColorOverride?: string;
  /** Override the drop-shadow opacity. */
  shadowOpacityOverride?: number;
  /** Override the drop-shadow blur radius. */
  shadowRadiusOverride?: number;
}

/**
 * Liquid Glass surface — a reusable, layered material that reads as a real
 * piece of glass rather than a flat translucent rectangle.
 *
 * Layers (bottom → top):
 *   1. Translucent tinted fill + 1px outer border + dynamic soft shadow
 *      (the surface itself; tint also guarantees the shadow casts on iOS).
 *   2. BlurView — diffuses whatever sits behind the glass.
 *   3. Content (in flow, sits sharp above the blur).
 *   4. SVG top sheen — internal highlight + soft edge reflection.
 *   5. 1px inner highlight ring — crisp glass edge.
 *
 * Overlay layers are pointer-events-none so they never intercept touches.
 */
export function GlassSurface({
  children,
  style,
  circular = false,
  radius,
  blur = true,
  sheenBoost = 1,
  fillOverride,
  borderOverride,
  shadowColorOverride,
  shadowOpacityOverride,
  shadowRadiusOverride,
}: GlassSurfaceProps) {
  const { isDark } = useTheme();
  const g = isDark ? liquidGlass.dark : liquidGlass.light;
  const r = radius ?? (circular ? 9999 : navigationTokens.capsuleRadius);

  const fill = fillOverride ?? g.tint;
  const border = borderOverride ?? g.border;
  const shadowColor = shadowColorOverride ?? g.shadow;
  const shadowOpacity = shadowOpacityOverride ?? (isDark ? 0.32 : 0.2);
  const shadowRadius = shadowRadiusOverride ?? 28;

  return (
    <View
      style={[
        {
          borderRadius: r,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: fill,
          overflow: 'hidden',
          // Dynamic, diffuse elevation — present but never heavy.
          shadowColor,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity,
          shadowRadius,
          elevation: 10,
        },
        style,
      ]}
    >
      {/* Layer 2 — diffuse blur of whatever is behind the glass. */}
      {blur && (
        <BlurView
          style={StyleSheet.absoluteFill}
          tint={isDark ? 'dark' : 'light'}
          intensity={isDark ? navigationTokens.glassIntensityDark : navigationTokens.glassIntensityLight}
        />
      )}

      {/* Layer 3 — content (sharp, sits above the blur). */}
      {children}

      {/* Layer 4 — top sheen: internal highlight + soft edge reflection. */}
      <Svg
        style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
        pointerEvents="none"
        preserveAspectRatio="none"
      >
        <Defs>
          <SvgGradient id="glassSheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={g.sheen} stopOpacity={Math.min(1, g.sheenOpacity * sheenBoost)} />
            <Stop offset="44%" stopColor={g.sheen} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glassSheen)" />
      </Svg>

      {/* Layer 5 — 1px inner highlight ring (crisp glass edge). */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 3,
            borderWidth: 1,
            borderColor: g.innerHighlight,
            borderRadius: Math.max(0, r - 1),
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}
