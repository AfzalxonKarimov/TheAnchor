import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  /** Effective dark-mode flag used by all screens for styling. */
  isDark: boolean;
  /** The user's explicit choice ('light' | 'dark'). Persisted. */
  mode: ThemeMode;
  /** Set the explicit theme (overrides system). */
  setMode: (mode: ThemeMode) => void;
  /** Convenience toggle between light and dark. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theanchor.themeMode';

/**
 * Central theme provider.
 *
 * Design decisions:
 * - On first launch, follows the OS setting (via useColorScheme) so the app
 *   respects the device without forcing a choice.
 * - Once the user flips the Profile toggle, that explicit choice is persisted
 *   in AsyncStorage and wins over the system setting.
 * - This is the ONLY place that consumes useColorScheme(); every screen should
 *   use useTheme() instead so the manual override propagates everywhere.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemIsDark = useColorScheme() === 'dark';
  const [mode, setModeState] = useState<ThemeMode>(systemIsDark ? 'dark' : 'light');

  // Load a persisted explicit choice on mount; fall back to system preference.
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        } else {
          setModeState(systemIsDark ? 'dark' : 'light');
        }
      })
      .catch(() => {
        /* Storage unavailable — keep system default. */
      });
    return () => {
      mounted = false;
    };
  }, [systemIsDark]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* Non-fatal if persistence fails. */
    });
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value: ThemeContextValue = {
    isDark: mode === 'dark',
    mode,
    setMode,
    toggle,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
