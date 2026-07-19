/**
 * Resolved, theme-adaptive palette for the premium design system.
 *
 * Components should call `useThemeColors()` instead of inlining
 * `isDark ? colors.dark.x : colors.light.x` everywhere. Returns the full
 * set of semantic tokens (accent, surfaces, text, hairline, glass) already
 * resolved for the active theme so every surface reads consistently.
 */

import { useTheme } from './ThemeProvider';
import { colors, glass } from '../constants/theme';

export interface ThemeColors {
  isDark: boolean;
  accent: string;
  accentGlow: string;
  accentSoft: string;
  accentStrong: string;
  onAccent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  hairline: string;
  success: string;
  warning: string;
  error: string;
  errorStrong: string;
  glass: { backgroundColor: string; borderColor: string };
}

export function useThemeColors(): ThemeColors {
  const { isDark } = useTheme();
  const t = isDark ? colors.dark : colors.light;
  return {
    isDark,
    accent: colors.primary,
    accentGlow: colors.accentGlow,
    accentSoft: colors.primarySoft,
    accentStrong: colors.primaryStrong,
    onAccent: colors.onAccent,
    background: t.background,
    surface: t.surface,
    surfaceAlt: t.surfaceAlt,
    text: t.text,
    textSecondary: t.textSecondary,
    textMuted: t.textMuted,
    border: t.border,
    hairline: t.hairline,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    errorStrong: colors.errorStrong,
    glass: isDark ? glass.dark : glass.light,
  };
}
