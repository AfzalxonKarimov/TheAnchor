import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider } from './src/auth/AuthContext';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './src/navigation/TabNavigator';
import SessionScreen from './screens/SessionScreen';
import AddHabitScreen from './screens/AddHabitScreen';

const Stack = createNativeStackNavigator();

// Configure deep linking
const linking = {
  prefixes: ['theanchor://'],
  config: {
    screens: {
      Login: 'login',
      Index: 'home',
      Onboarding: 'onboarding',
      Journey: 'journey',
      Progress: 'progress',
      Profile: 'profile',
      Session: 'session',
      AddHabit: 'add-habit',
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
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
        {/* Session screen accessed via floating button */}
        <Stack.Screen
          name="session"
          component={SessionScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}