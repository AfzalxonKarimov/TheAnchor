import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationTokens } from '../constants/theme';

/**
 * Hook to get properly calculated insets for tab screens.
 * Returns paddingTop that accounts for the navigation bar height.
 *
 * Design decision: Each screen needs to add padding at the bottom
 * to prevent content from being hidden behind the tab bar.
 */
export function useTabInsets() {
  const insets = useSafeAreaInsets();

  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom + navigationTokens.tabBarHeight,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    safeArea: {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
    },
  };
}