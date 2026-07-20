/**
 * Design system tokens for TheAnchor app.
 * Premium, calm, minimal aesthetic — Apple + Linear + Arc + Notion Mobile.
 * Accent: Calm Teal. Everything is theme-adaptive (light + dark).
 */

import { StyleSheet } from 'react-native';

// ── Spacing — single 8pt grid (8 / 16 / 24 / 32 / 48) ───────────────
// Every gap, pad, and margin in the app resolves to one of these tokens so
// rhythm stays consistent across screens. (4px kept only for micro-insets.)
// Every value lives on the single 8pt grid: 4 (micro-inset only) / 8 / 16 / 24 / 32 / 48.
// `lg` and `xl` intentionally resolve to the same 24 so cards and section gaps
// share one rhythm; `md` (16) is the tight intra-card gap.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 48,
} as const;

// ── Corner radius ───────────────────────────────────────────────────────
export const corner = {
  xs: 12, // compact inputs, inner pills
  sm: 16, // small surfaces, pills inside cards
  field: 14, // form fields & controls
  md: 18, // buttons
  control: 20, // circular controls (color swatches)
  lg: 24, // cards
  xl: 24, // large hero surfaces (kept on the 24px card grid)
  pill: 999,
} as const;

// ── Typography ──────────────────────────────────────────────────────────
export const typography = {
  display: {
    fontSize: 44,
    fontWeight: '700' as const,
    lineHeight: 50,
    letterSpacing: -1,
  },
  displayLarge: {
    fontSize: 64,
    fontWeight: '300' as const,
    lineHeight: 70,
    letterSpacing: -2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  small: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  // ── Intermediate sizes used across screens (centralized to stop inline
  //    fontSize overrides). Numbers mirror what was previously hard-coded. ──
  micro: {
    fontSize: 10,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  headingSm: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  headingMd: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  headingLg: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  displayXxs: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  displayXs: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  displaySm: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 42,
  },
  displayMd: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  displayLg: {
    fontSize: 52,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
    lineHeight: 58,
  },
} as const;

// ── Brand / accent colors — Calm Teal ───────────────────────────────────
export const colors = {
  // Primary action (teal) — used for key actions, rings, FAB, XP glow.
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primarySoft: '#5EEAD4',
  // Deep teal for teal *text* on light surfaces (primary #2DD4BF fails 4.5:1).
  // Also a valid darker fill if a stronger teal is ever needed.
  primaryStrong: '#0F766E',
  // Legacy alias kept for any stragglers — equals primary (bright teal).
  accent: '#2DD4BF',
  accentGlow: '#14B8A6',

  // Semantic colors
  success: '#34C759',
  warning: '#FFB020',
  error: '#FF6B6B',
  // Deeper variants for *text* on light surfaces (the base hues fail AA).
  errorStrong: '#C0392B',

  // Ink for text/icon siting ON teal/success fills and their tints.
  // #06201D on #2DD4BF ≈ 11:1, on #34C759 ≈ 7.8:1 — passes AA everywhere.
  onAccent: '#06201D',

  // Neutral palette
  neutral: {
    50: '#FAFAFA',
    100: '#F2F2F2',
    200: '#E5E5E5',
    300: '#D1D1D1',
    400: '#8A9694',
    500: '#6B6B6B',
    600: '#3C3C3C',
    700: '#1F1F1F',
    800: '#121212',
    900: '#000000',
  },

  // Light theme — soft off-white, faint teal-tinted surfaces
  light: {
    background: '#FAFBFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F6F5',
    text: '#0B0E0D',
    textSecondary: '#4A5754',
    // Deepened from #8A9694 (~3.1:1) to pass WCAG AA (≥4.5:1) on background.
    textMuted: '#5C6B68',
    border: '#E8EDEC',
    hairline: 'rgba(11,14,13,0.06)',
  },

  // Dark theme — deep teal-tinted near-black (per design spec)
  dark: {
    background: '#0B0E0D',
    surface: '#141B18',
    surfaceAlt: '#18211D',
    text: '#F2F7F6',
    textSecondary: '#A8B5B2',
    // Lightened from #6E7C79 (~4.4:1) to pass AA on the dark background.
    textMuted: '#8A9694',
    border: '#222C2A',
    hairline: 'rgba(255,255,255,0.06)',
  },
} as const;

// ── Navigation-specific tokens ──────────────────────────────────────────
// Tuned for a floating, glassy, Apple-first-party feel.
export const navigationTokens = {
  /** Legacy: total reserved vertical space for a non-floating bar. Kept for
   *  any consumers still measuring against it; the live nav uses the tokens
   *  below instead. */
  tabBarHeight: 112,
  /** Center check-in button diameter (px). Smaller + lighter than before. */
  floatingButtonSize: 52,
  /** Resting / active icon size (px). Active emphasis comes from scale + tint,
   *  not a size jump, so these stay close. */
  iconSize: 22,
  iconSizeActive: 23,
  /** Pill corner radius — large + soft (24–30px range). */
  cornerRadius: 28,
  /** Hairline border weight (px). Thin, low-opacity. */
  borderWidth: 1,
  /** Gap between the floating pill's bottom and the bottom safe-area edge. */
  floatingBottomMargin: 12,
  /** How far the crowned FAB rises above the pill's top edge (px). */
  fabProtrusion: 18,
  /** Bottom padding screens should reserve so content clears the floating nav. */
  tabClearance: 112,
  /** Tab label size (pt). 11pt, medium weight — small + calm. */
  labelSize: 11,
  /** Vertical breathing room inside the pill (px, per side). */
  pillVerticalPadding: 8,

  // ── Liquid Glass navigation tokens (new floating nav) ──────────────
  /** Horizontal inset from screen edges (px). The capsule must float clear. */
  horizontalMargin: 18,
  /** Bottom inset above the safe area (px). */
  bottomMargin: 16,
  /** Capsule corner radius (px) — 30–34 premium range. */
  capsuleRadius: 32,
  /** Blur intensity for the glass capsule (light / dark). */
  glassIntensityLight: 72,
  glassIntensityDark: 96,
  /** Resting icon size (px) per design spec. */
  iconSizeGlass: 24,
  /** Active icon scale + lift (px). */
  iconActiveScale: 1.08,
  iconActiveLift: -2,
  /** Total capsule height (px) — tall enough to seat the crowned center button. */
  capsuleHeight: 76,
  /** Center check-in button diameter (px). Refined + lighter than before. */
  centerButtonSize: 50,
  /** How far the crowned center button rises above the capsule top (px). */
  centerProtrusion: 16,
  /** Liquid glass bead behind the active icon (px). */
  indicatorWidth: 54,
  indicatorHeight: 40,
  /** Vertical offset of the icon center above the slot center (px), so the
   *  bead lands on the icon rather than the icon+label group. */
  iconBlockOffset: 9,
  /** Tab label size (pt) for the glass nav. */
  labelSizeGlass: 11,
  /** Spring config for the sliding indicator glide. */
  indicatorSpring: { damping: 20, stiffness: 200 } as const,
  /** Spring config for the center button press. */
  pressSpring: { damping: 12, stiffness: 340 } as const,
  /** Entrance offset (px) — nav fades upward on app open. */
  enterOffset: 22,
} as const;

// ── Animation — subtle, springy, calm ───────────────────────────────────
export const animation = {
  fast: 150,
  medium: 280,
  slow: 420,
  spring: { tension: 120, friction: 14 } as const,
  springSoft: { tension: 90, friction: 18 } as const,
  easeOut: { duration: 420, useNativeDriver: true } as const,
} as const;

// ── Layered shadows (soft depth, never heavy) ──────────────────────────
export const shadow = {
  soft: {
    shadowColor: '#050807',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  elevate: {
    shadowColor: '#050807',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;

// ── Glass surfaces (translucent + hairline) ─────────────────────────────
export const glass = {
  light: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  dark: {
    backgroundColor: 'rgba(20,27,24,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
} as const;

// ── Liquid Glass navigation palette ─────────────────────────────────────
// Theme-adaptive layered colors for the floating glass capsule, the sliding
// active bead, and the crowned center button. Each layer is tuned so the
// material reads as real glass (translucent tint + low-opacity white sheen +
// crisp inner highlight) rather than a flat translucent rectangle.
export const liquidGlass = {
  light: {
    /** Low-opacity white tint — the translucent surface itself. */
    tint: 'rgba(248,250,250,0.50)',
    /** Subtle outer border (1px). */
    border: 'rgba(255,255,255,0.55)',
    /** 1px inner highlight ring (crisp glass edge). */
    innerHighlight: 'rgba(255,255,255,0.90)',
    /** Top sheen — internal highlight / soft edge reflection. */
    sheen: 'rgba(255,255,255,0.55)',
    sheenOpacity: 0.55,
    /** Dynamic shadow color. */
    shadow: '#04100E',
    /** Liquid bead behind the active icon. */
    indicatorFill: 'rgba(45,212,191,0.18)',
    indicatorBorder: 'rgba(45,212,191,0.35)',
    /** Crowned center button. */
    centerFill: '#2DD4BF',
    centerBorder: 'rgba(255,255,255,0.50)',
    centerSheen: 'rgba(255,255,255,0.38)',
  },
  dark: {
    tint: 'rgba(16,24,21,0.55)',
    border: 'rgba(255,255,255,0.14)',
    innerHighlight: 'rgba(255,255,255,0.20)',
    sheen: 'rgba(255,255,255,0.16)',
    sheenOpacity: 0.16,
    shadow: '#000000',
    indicatorFill: 'rgba(45,212,191,0.26)',
    indicatorBorder: 'rgba(45,212,191,0.45)',
    centerFill: '#2DD4BF',
    centerBorder: 'rgba(255,255,255,0.16)',
    centerSheen: 'rgba(255,255,255,0.18)',
  },
} as const;

// ── Base reusable styles ────────────────────────────────────────────────
export const baseStyles = StyleSheet.create({
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: shadow.soft,
  shadowElevate: shadow.elevate,
});
