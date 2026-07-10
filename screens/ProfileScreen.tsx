import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Switch,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel } from '../lib/leveling';
import { supabase } from '../src/supabase/client';

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
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [xp, setXp] = useState(150);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserEmail(data.user.email || 'user@example.com');
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
            <FontAwesome5 name="user" size={32} color={colors.primary} />
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
            value={darkMode}
            onValueChange={setDarkMode}
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
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  return (
    <TouchableOpacity style={styles.settingsItem}>
      <View style={styles.settingsLeft}>
        <View style={[styles.settingsIcon, { backgroundColor: `${colors.primary}10` }]}>
          <FontAwesome5 name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
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
});