import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Modal, Platform, useColorScheme } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingActionButton } from '../components/navigation/FloatingActionButton';
import { TabBarIcon } from '../components/navigation/TabBarIcon';
import { colors, spacing, typography, baseStyles } from '../constants/theme';
import { Anchor } from './types';
import { supabase } from '../supabase/client';
import { getTodaySessions } from '../supabase/sessions';
import * as Haptics from 'expo-haptics';

// Screens
import HomeScreen from '../../screens/HomeScreen';
import JourneyScreen from '../../screens/JourneyScreen';
import ProgressScreen from '../../screens/ProgressScreen';
import ProfileScreen from '../../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

/**
 * Tab Navigator with custom floating action button.
 *
 * Architecture decisions:
 * - Uses createBottomTabNavigator for declarative navigation
 * - Custom tab bar with floating center button
 * - Anchor selection modal triggered by floating button
 * - Each tab screen receives proper insets for content layout
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="index" component={HomeScreen} />
      <Tab.Screen name="journey" component={JourneyScreen} />
      <Tab.Screen name="progress" component={ProgressScreen} />
      <Tab.Screen name="profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * Custom Tab Bar with floating center button.
 *
 * Design decisions:
 * - Floating button is positioned absolutely to overlay tab bar
 * - SafeAreaView ensures content respects notches and home indicators
 * - Uses standard tab bar height with proper inset handling
 */
function CustomTabBar({
  state,
  descriptors,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Modal state for anchor selection
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const loadAnchors = useCallback(async () => {
    console.log('Loading anchors...');
    try {
      const { data, error } = await supabase.from('anchors').select('*');
      console.log('Anchors query result:', { dataLength: data?.length, error });
      if (!error && data && data.length > 0) {
        setAnchors(
          data.map((a: any) => ({
            id: a.id,
            title: a.title,
            icon: a.icon,
            color: a.color,
            targetDays: a.target_days,
            minimumDuration: a.minimum_duration,
            consistency: a.consistency,
          }))
        );
      } else if (__DEV__) {
        // Dev mode fallback - always use fallback in dev mode
        console.log('Using dev mode fallback anchors');
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#34C759', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#007AFF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'futbol', color: '#FF3B30', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
      }
    } catch (e) {
      console.warn('Error loading anchors:', e);
      if (__DEV__) {
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#34C759', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#007AFF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'futbol', color: '#FF3B30', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
      }
    }
  }, []);

  const loadTodaySessions = useCallback(async () => {
    try {
      const sessions = await getTodaySessions();
      console.log('Today sessions loaded:', sessions?.length || 0);
      setTodaySessions(sessions || []);
    } catch (e) {
      console.warn('Error loading today sessions:', e);
      setTodaySessions([]);
    }
  }, []);

  // In dev mode, use placeholder sessions if no user (for testing)
  useEffect(() => {
    if (__DEV__ && todaySessions.length === 0 && anchors.length > 0) {
      // No sessions today in dev mode - this is fine, all anchors are due
      console.log('Dev mode: No sessions today, all anchors will be due');
    }
  }, [todaySessions, anchors]);

  useEffect(() => {
    loadAnchors();
    loadTodaySessions();
  }, [loadAnchors, loadTodaySessions]);

  const centerTabIndex = 2; // Center position for floating button

  // Determine which anchors are due today (not yet completed)
  const anchorsDueToday = anchors.filter(anchor => {
    return !todaySessions.some(s => s.anchor_id === anchor.id);
  });

  const handleFloatingPress = async () => {
    console.log('PLAY BUTTON PRESSED - anchors:', anchors.length, 'dueToday:', anchorsDueToday.length);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Silently fail on unsupported devices
      }
    }

    if (anchorsDueToday.length === 0) {
      console.log('No anchors due today');
      return;
    }

    if (anchorsDueToday.length === 1) {
      console.log('Auto-starting session for anchor:', anchorsDueToday[0].id);
      // Auto-start check-in for the single due anchor
      navigation.navigate('session' as never, { anchorId: anchorsDueToday[0].id } as never);
    } else {
      console.log('Showing picker modal for', anchorsDueToday.length, 'anchors');
      // Show picker modal for multiple due anchors
      setModalVisible(true);
    }
  };

  const handleSelectAnchor = (anchor: Anchor) => {
    setModalVisible(false);
    navigation.navigate('session' as never, { anchorId: anchor.id } as never);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
            borderTopColor: isDark ? colors.dark.border : colors.light.border,
            paddingBottom: insets.bottom || 12,
          },
        ]}
      >
        {/* Top border for separation */}
        <View
          style={[
            styles.topBorder,
            { backgroundColor: isDark ? colors.dark.border : colors.light.border },
          ]}
        />

        {/* Tab bar content */}
        <View style={styles.tabContainer}>
          {/* Left tabs (Home, Journey) */}
          <View style={styles.sideTabs}>
            {state.routes.slice(0, centerTabIndex).map((route: any, index: number) => (
              <TabBarItem
                key={route.key}
                route={route}
                isFocused={state.index === index}
                onPress={() => navigation.navigate(route.name)}
              />
            ))}
          </View>

          {/* Center floating button */}
          <View style={styles.floatingContainer}>
            <FloatingActionButton onPress={handleFloatingPress} />
          </View>

          {/* Right tabs (Progress, Profile) */}
          <View style={styles.sideTabs}>
            {state.routes.slice(centerTabIndex + 1).map((route: any, index: number) => {
              const actualIndex = index + centerTabIndex + 1;
              return (
                <TabBarItem
                  key={route.key}
                  route={route}
                  isFocused={state.index === actualIndex}
                  onPress={() => navigation.navigate(route.name)}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Anchor Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <AnchorSelectionModal
          anchors={anchorsDueToday}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectAnchor}
        />
      </Modal>
    </>
  );
}

/**
 * Individual tab bar item with icon.
 */
function TabBarItem({ route, isFocused, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TabBarIcon
        name={getIconName(route.name)}
        focused={isFocused}
      />
    </TouchableOpacity>
  );
}

/**
 * Map route names to icon names.
 */
function getIconName(routeName: string): any {
  const iconMap: Record<string, any> = {
    index: 'home',
    journey: 'compass',
    progress: 'bar-chart',
    profile: 'user',
  };
  return iconMap[routeName] || 'circle';
}

/**
 * Modal for selecting an anchor to start a session.
 */
function AnchorSelectionModal({
  anchors,
  onClose,
  onSelect,
}: {
  anchors: Anchor[];
  onClose: () => void;
  onSelect: (anchor: Anchor) => void;
}) {
  return (
    <View style={styles.modalContainer}>
      <View style={styles.backdrop} />
      {/* Grab indicator */}
      <View style={styles.grabIndicator} />

      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Anchor</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={anchors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.modalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.anchorItem, { borderColor: item.color }]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.anchorIcon, { backgroundColor: `${item.color}20` }]}>
                <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.anchorInfo}>
                <Text style={styles.anchorTitle}>{item.title}</Text>
                <Text style={styles.anchorDetails}>
                  {item.targetDays} days • {item.minimumDuration} min
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyAnchors}>
              <Text style={styles.emptyText}>No anchors yet. Create one in Journey.</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...baseStyles.shadow,
    borderTopWidth: 0.5,
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
    marginTop: -32, // Half of floating button size to overlap tab bar
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  grabIndicator: {
    width: 40,
    height: 5,
    backgroundColor: colors.neutral[300],
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalContent: {
    backgroundColor: colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    ...typography.title,
    fontWeight: '600',
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
  },
  modalList: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  anchorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.light.background,
  },
  anchorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...baseStyles.flexCenter,
    marginRight: spacing.lg,
  },
  anchorInfo: { flex: 1 },
  anchorTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  anchorDetails: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  emptyAnchors: {
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});