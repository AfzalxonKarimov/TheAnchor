/**
 * Design system tokens for TheAnchor app.
 * Premium, calm, minimal aesthetic inspired by Linear/Notion/Apple Health.
 * All colors work in both light and dark modes.
 */

import { StyleSheet } from 'react-native';

// Spacing scale - consistent across components
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Typography scale
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
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
} as const;

// Brand colors - muted, premium palette
export const colors = {
  // Primary action (used sparingly for floating button and key actions)
  primary: '#007AFF',
  primaryDark: '#0062CC',

  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Neutral palette - works for both themes
  neutral: {
    50: '#FAFAFA',
    100: '#F2F2F2',
    200: '#E5E5E5',
    300: '#D1D1D1',
    400: '#A3A3A3',
    500: '#6B6B6B',
    600: '#3C3C3C',
    700: '#1F1F1F',
    800: '#121212',
    900: '#000000',
  },

  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F2F2F2',
    text: '#000000',
    textSecondary: '#6B6B6B',
    textMuted: '#A3A3A3',
    border: '#E5E5E5',
  },

  // Dark theme
  dark: {
    background: '#000000',
    surface: '#121212',
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textMuted: '#6B6B6B',
    border: '#1F1F1F',
  },
} as const;

// Navigation-specific tokens
export const navigationTokens = {
  tabBarHeight: 80,
  floatingButtonSize: 64,
  iconSize: 24,
  iconSizeActive: 28,
  cornerRadius: 20,
  borderWidth: 0.5,
} as const;

// Animation durations - subtle and smooth
export const animation = {
  fast: 150,
  medium: 250,
  slow: 350,
} as const;

// Base styles for consistent theming
export const baseStyles = StyleSheet.create({
  flexCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shadow: {
    // Subtle elevation - no heavy shadows
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});