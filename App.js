import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './src/auth/AuthContext';
import { ThemeProvider } from './src/theme/ThemeProvider';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import SessionScreen from './screens/SessionScreen';
import AddHabitScreen from './screens/AddHabitScreen';
import EditAnchorScreen from './screens/EditAnchorScreen';

const Stack = createNativeStackNavigator();

// Configure deep linking. The tab screens (journey/progress/profile/index) live
// INSIDE the `Index` (TabNavigator) screen, so they must be nested under it —
// declaring them at the top level (as before) made React Navigation report
// linking "configured in multiple places". Only real stack screens are listed.
const linking = {
  prefixes: ['theanchor://'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Login: 'login',
      Index: {
        path: 'home',
        screens: {
          index: '',
          journey: 'journey',
          progress: 'progress',
          profile: 'profile',
        },
      },
      AddHabit: 'add-habit',
      EditAnchor: 'edit-anchor',
      session: 'session',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator initialRouteName="Onboarding">
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          {/* Tab Navigator contains all main app screens */}
          <Stack.Screen
            name="Index"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          {/* AddHabit screen for creating anchors */}
          <Stack.Screen
            name="AddHabit"
            component={AddHabitScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          {/* EditAnchor screen for editing an existing anchor */}
          <Stack.Screen
            name="EditAnchor"
            component={EditAnchorScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          {/* Session screen accessed via floating button */}
          <Stack.Screen
            name="session"
            component={SessionScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}