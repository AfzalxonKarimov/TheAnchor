import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LiquidTabBar } from '../components/navigation/LiquidTabBar';

import HomeScreen from '../../screens/HomeScreen';
import JourneyScreen from '../../screens/JourneyScreen';
import ProgressScreen from '../../screens/ProgressScreen';
import ProfileScreen from '../../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

/**
 * Tab Navigator with a custom floating Liquid Glass nav.
 *
 * Architecture decisions:
 *  - Uses createBottomTabNavigator for declarative navigation.
 *  - Custom tab bar is a floating glass capsule above the bottom safe area,
 *    with a crowned center check-in button and a sliding liquid indicator,
 *    implemented in LiquidTabBar (see that file for the material details).
 *  - Each tab screen reserves its own bottom clearance via
 *    navigationTokens.tabClearance so content never hides behind the nav.
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidTabBar {...props} />}
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
