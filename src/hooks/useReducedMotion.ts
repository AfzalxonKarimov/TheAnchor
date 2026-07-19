import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns whether the user has requested reduced motion at the OS level.
 * Used to disable perpetual/decorative animations (XP shimmer, FAB pulse)
 * and to snap progress animations instead of replaying them.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    const update = (v: boolean) => {
      if (mounted) setReduced(!!v);
    };

    // Initial read (returns a Promise<boolean> in modern React Native).
    if (typeof AccessibilityInfo.isReduceMotionEnabled === 'function') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then(update)
        .catch(() => {});
    }

    // Subscribe to changes. RN >= 0.70 returns a subscription object with
    // `.remove()`; older versions use addEventListener/removeEventListener.
    const handler = (v: boolean) => update(v);
    let sub: { remove: () => void } | null = null;
    if (typeof AccessibilityInfo.addEventListener === 'function') {
      sub = AccessibilityInfo.addEventListener('reduceMotionChanged', handler) as any;
    }

    return () => {
      mounted = false;
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, []);

  return reduced;
}
