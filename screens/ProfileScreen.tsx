import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel } from '../lib/leveling';
import { useAuth } from '../src/auth/AuthContext';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { getProfile } from '../src/supabase/profiles';

// Feature flag for subscription feature (easy to re-enable later)
const SHOW_SUBSCRIPTION = false;

/**
 * Profile Screen - User settings and account management.
 *
 * Design decisions:
 * - Clean section-based layout
 * - Avatar placeholder with rank badge
 * - Grouped settings for clarity
 * - Dark mode aware styling
 * - Logout as destructive action at bottom
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [xp, setXp] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { isDark, mode, setMode } = useTheme();

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const userEmail = user?.email || 'user@example.com';

  // Load XP from profile on focus
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            setXp(profile.total_xp || 0);
          }
        } catch (e) {
          console.warn('Failed to load profile', e);
        }
      };
      loadProfile();
    }, [])
  );

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      // Clearing the Supabase session sets `session` to null, but the app uses
      // imperative navigation — nothing auto-redirects on sign-out. Reset the
      // root stack back to Login so the user actually leaves the app.
      const rootNav = navigation.getParent() ?? navigation;
      rootNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (e: any) {
      setLoggingOut(false);
      Alert.alert('Sign out failed', e?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
            <FontAwesome5 name="anchor" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.email, { color: isDark ? colors.dark.text : colors.light.text }]}>
            {userEmail}
          </Text>
          <View style={[styles.rankBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.rankText, { color: colors.primary }]}>
              {rank} • Level {level}
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.settingsSection}>
          <SettingsItem
            icon="bell"
            label="Notifications"
            isToggle
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingsItem
            icon="moon"
            label="Dark Mode"
            isToggle
            value={mode === 'dark'}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
          />
          {SHOW_SUBSCRIPTION && (
            <SettingsItem icon="credit-card" label="Subscription" />
          )}
          <SettingsItem icon="question-circle" label="Help & Support" />
        </View>

        {/* Logout - Destructive action at bottom */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging Out…' : 'Log Out'}
          </Text>
        </TouchableOpacity>

        {/* Brand footer — fills the empty space below settings */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.neutral[400] }]}>
            TheAnchor
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.neutral[300] }]}>
            Built for the days your motivation runs out.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  label,
  isToggle,
  value,
  onValueChange,
}: {
  icon: string;
  label: string;
  isToggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.settingsItem,
        { borderBottomColor: isDark ? colors.dark.border : colors.light.border },
      ]}
    >
      <View style={styles.settingsLeft}>
        <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}10` }]}>
          <FontAwesome5 name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.settingsLabel,
            { color: isDark ? colors.dark.text : colors.light.text },
          ]}
        >
          {label}
        </Text>
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.neutral[300], true: `${colors.primary}50` }}
          thumbColor={value ? colors.primary : colors.neutral[100]}
        />
      ) : (
        <FontAwesome5 name="chevron-right" size={16} color={colors.neutral[400]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    ...baseStyles.flexCenter,
    marginBottom: spacing.lg,
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  rankBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: spacing.xxxl,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...baseStyles.flexCenter,
  },
  settingsLabel: {
    fontSize: 16,
    color: colors.neutral[700],
  },
  logoutRow: {
    paddingVertical: spacing.lg,
    marginTop: 'auto',
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 0,
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});