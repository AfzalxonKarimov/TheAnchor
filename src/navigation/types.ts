/**
 * Navigation type definitions for TheAnchor app.
 * Centralized types ensure type safety across navigation components.
 */

/**
 * Tab route names - single source of truth for navigation.
 * Using 'as const' ensures type inference for route names.
 */
export const TAB_ROUTES = {
  HOME: 'index',
  JOURNEY: 'journey',
  PROGRESS: 'progress',
  PROFILE: 'profile',
  SESSION: 'session',
} as const;

export type TabRouteName = typeof TAB_ROUTES[keyof typeof TAB_ROUTES];

/**
 * Anchor data shape used throughout the app.
 * Defined here to ensure consistent typing across navigation, storage, and UI.
 */
export interface Anchor {
  id: string;
  title: string;
  icon: string;
  color: string;
  targetDays: number;
  minimumDuration: number;
  consistency?: number;
  createdAt?: string;
  userId?: string;
}

/**
 * Screen params for typed navigation.
 * Use these when navigating between screens to ensure type safety.
 */
export type RootStackParamList = {
  // Tab screens (main app)
  [TAB_ROUTES.HOME]: undefined;
  [TAB_ROUTES.JOURNEY]: undefined;
  [TAB_ROUTES.PROGRESS]: undefined;
  [TAB_ROUTES.PROFILE]: undefined;

  // Session screen (accessed via floating button)
  session: { anchorId: string };

  // Modal/bottom sheet screens
  anchorSelection: undefined;
};