import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import {
  BottomTabBarProps,
  useBottomTabBarHeight,
} from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingActionButton } from './FloatingActionButton';
import { TabBarIcon } from './TabBarIcon';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors, navigationTokens, spacing, baseStyles } from '../../constants/theme';

/**
 * Custom Bottom Tab Bar with floating center button.
 *
 * Architecture decisions:
 * 1. Uses official useBottomTabBarHeight hook for proper safe area integration
 * 2. Floating button is positioned absolutely to overlay tab bar
 * 3. SafeAreaView ensures content respects notches and home indicators
 * 4. Reduced motion support ready (can be extended with accessibility hooks)
 * 5. Theme-aware with light/dark mode support
 */
export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Get the tab that should have the floating button (center position)
  // We use the middle index (2) for the Start button
  const centerTabIndex = Math.floor(state.routes.length / 2);

  const handleFloatingPress = () => {
    // Navigate to anchor selection modal
    // This will be handled by the parent navigator
    navigation.navigate('anchorSelection' as never);
  };

  // Render individual tab items (excluding center for floating button)
  const renderTab = (route: typeof state.routes[0], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    // Get icon name from route options or default
    const iconName = options.tabBarIcon?.toString() || 'circle';

    return (
      <View key={route.key} style={styles.tabItem}>
        <TabBarIcon
          name={getIconName(route.name)}
          focused={isFocused}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
          borderTopColor: isDark ? colors.dark.border : colors.light.border,
          paddingBottom: insets.bottom,
          height: navigationTokens.tabBarHeight + insets.bottom,
        },
      ]}
    >
      {/* Top border for subtle separation */}
      <View
        style={[
          styles.topBorder,
          { backgroundColor: isDark ? colors.dark.border : colors.light.border },
        ]}
      />

      {/* Tab bar content */}
      <View style={styles.tabContainer}>
        {/* Left tabs */}
        <View style={styles.sideTabs}>
          {state.routes.slice(0, centerTabIndex).map((route, index) => (
            <View key={route.key} style={styles.tabItem}>
              <TabBarIcon
                name={getIconName(route.name)}
                focused={state.index === index}
              />
            </View>
          ))}
        </View>

        {/* Center floating button */}
        <View style={styles.floatingContainer}>
          <FloatingActionButton onPress={handleFloatingPress} />
        </View>

        {/* Right tabs */}
        <View style={styles.sideTabs}>
          {state.routes.slice(centerTabIndex + 1).map((route, index) => {
            const actualIndex = index + centerTabIndex + 1;
            return (
              <View key={route.key} style={styles.tabItem}>
                <TabBarIcon
                  name={getIconName(route.name)}
                  focused={state.index === actualIndex}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * Map route names to icon names.
 * Single source of truth for tab icon mapping.
 */
function getIconName(routeName: string): React.ComponentProps<typeof FontAwesome5>['name'] {
  const iconMap: Record<string, React.ComponentProps<typeof FontAwesome5>['name']> = {
    index: 'home',
    journey: 'compass',
    progress: 'chart-bar',
    profile: 'user',
  };
  return iconMap[routeName] || 'circle';
}

const styles = StyleSheet.create({
  container: {
    ...baseStyles.shadow,
    borderTopWidth: navigationTokens.borderWidth,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  sideTabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    ...baseStyles.flexCenter,
    flex: 1,
    paddingVertical: spacing.md,
  },
  floatingContainer: {
    ...baseStyles.flexCenter,
    // Negative margin to overlap the tab bar
    marginTop: -navigationTokens.floatingButtonSize / 2,
    // Extra padding to center the floating button
    paddingHorizontal: spacing.lg,
  },
});