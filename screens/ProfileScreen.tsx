import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, corner } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel, getLevelProgress, getXPForNextLevel } from '../lib/leveling';
import { useAuth } from '../src/auth/AuthContext';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { getProfile } from '../src/supabase/profiles';
import { getPersonalRecords } from '../src/supabase/analytics';
import { useTheme } from '../src/theme/ThemeProvider';
import {
  Surface,
  IconBadge,
  SectionHeader,
  XPBar,
  Segmented,
  ProgressRing,
  Reveal,
  StatTile,
} from '../src/components/ui';

const SHOW_SUBSCRIPTION = true;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const c = useThemeColors();
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [records, setRecords] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const { mode: themeMode, setMode: applyMode } = useTheme();

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const userEmail = user?.email || 'you@theanchor.app';
  const name = userEmail.split('@')[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            setXp(profile.total_xp || 0);
            setMomentum(profile.momentum || 50);
          }
          const rec = await getPersonalRecords();
          setRecords(rec);
        } catch (e) {
          console.warn('Profile load failed', e);
        }
      })();
    }, [])
  );

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      const rootNav = navigation.getParent() ?? navigation;
      rootNav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    } catch (e: any) {
      setLoggingOut(false);
      Alert.alert('Sign out failed', e?.message || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <Reveal>
          <View style={styles.identity}>
            <ProgressRing progress={getLevelProgress(xp)} size={120} strokeWidth={6}>
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}1F` }]}>
                <FontAwesome5 name="anchor" size={34} color={colors.primary} />
              </View>
            </ProgressRing>
            <Text style={[typography.heading, { color: c.text, marginTop: spacing.lg }]}>{name}</Text>
            <View style={[styles.rankChip, { backgroundColor: `${colors.primary}1F` }]}>
              <Text style={[typography.caption, { color: colors.primaryStrong, fontWeight: '700' }]}>{rank} · Level {level}</Text>
            </View>
          </View>
        </Reveal>

        {/* Level card */}
        <Reveal delay={60}>
          <Surface radius="xl" style={styles.card}>
            <View style={styles.levelRow}>
              <View>
                <Text style={[typography.caption, { color: c.textMuted }]}>Total XP</Text>
                <Text style={[typography.display, { color: c.text, fontSize: 32, marginTop: 2 }]}>{xp}</Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: `${colors.primary}1F` }]}>
                <FontAwesome5 name="bolt" size={13} color={colors.primary} />
                <Text style={[typography.small, { color: colors.primaryStrong, fontWeight: '700', marginLeft: 6 }]}>Lv {level}</Text>
              </View>
            </View>
            <XPBar progress={getLevelProgress(xp)} style={{ marginTop: spacing.lg }} />
            <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              {getXPForNextLevel(xp) - xp} XP to Level {level + 1}
            </Text>
          </Surface>
        </Reveal>

        {/* Stats summary */}
        <Reveal delay={100}>
          <View style={styles.statRow}>
            <StatTile label="Momentum" value={momentum} icon="chart-line" tint={colors.primary} compact />
            <StatTile label="Focus hrs" value={records?.totalHours ?? 0} icon="clock" tint={colors.accentGlow} compact />
            <StatTile label="Streak" value={records?.currentStreak ?? 0} icon="fire" tint={colors.warning} compact />
          </View>
        </Reveal>

        {/* Appearance */}
        <Reveal delay={140}>
          <Surface radius="xl" style={styles.card}>
            <SectionHeader title="Appearance" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text style={[typography.small, { color: c.text }]}>Theme</Text>
              <Segmented
                options={[{ key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' }]}
                value={themeMode}
                onChange={(k) => applyMode(k as 'light' | 'dark')}
                style={{ width: 180 }}
              />
            </View>
          </Surface>
        </Reveal>

        {/* Preferences */}
        <Reveal delay={180}>
          <Surface radius="xl" style={styles.card}>
            <SectionHeader title="Preferences" />
            <SettingRow icon="bell" label="Notifications" isToggle value={notifications} onValueChange={setNotifications} />
            <SettingRow
              icon="file-export"
              label="Export data"
              onPress={() => Alert.alert('Export', 'Your data export is being prepared.')}
            />
            <SettingRow icon="question-circle" label="Help & Support" last />
          </Surface>
        </Reveal>

        {/* Subscription — calm membership card, not an ad */}
        {SHOW_SUBSCRIPTION && (
          <Reveal delay={220}>
            <Surface radius="xl" style={[styles.card, styles.subCard]}>
              <View style={[styles.subWash, { backgroundColor: `${colors.primary}0A` }]} pointerEvents="none" />
              <View style={styles.subRow}>
                <IconBadge name="crown" color={colors.primary} box={44} size={19} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.eyebrow, { color: colors.primaryStrong }]}>MEMBERSHIP</Text>
                  <Text style={[typography.heading, { color: c.text, marginTop: spacing.xs }]}>TheAnchor Plus</Text>
                  <Text style={[typography.caption, { color: c.textMuted, marginTop: 2 }]}>
                    Recovery insights · unlimited anchors
                  </Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.8} style={[styles.manageBtn, { borderColor: c.hairline }]}>
                <Text style={[typography.small, { color: c.accentStrong, fontWeight: '700' }]}>Manage</Text>
              </TouchableOpacity>
            </Surface>
          </Reveal>
        )}

        {/* Logout */}
        <Reveal delay={260}>
          <TouchableOpacity onPress={handleLogout} disabled={loggingOut} activeOpacity={0.7} style={[styles.logout, { borderColor: c.hairline }]}>
            <FontAwesome5 name="sign-out-alt" size={16} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.errorStrong }]}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
          </TouchableOpacity>
        </Reveal>

        <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
          TheAnchor · built for the days motivation runs out
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, isToggle, value, onValueChange, onPress, last }: any) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: c.hairline }]}
    >
      <IconBadge name={icon} color={colors.primary} box={34} size={14} />
      <Text style={[typography.small, { color: c.text, flex: 1, marginLeft: spacing.md }]}>{label}</Text>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: c.textMuted, true: `${colors.primary}66` }}
          thumbColor={value ? colors.primary : '#fff'}
        />
      ) : (
        <FontAwesome5 name="chevron-right" size={15} color={c.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxxl },
  identity: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  rankChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: corner.pill, marginTop: spacing.sm },
  card: { padding: spacing.xl, marginBottom: spacing.lg },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: corner.pill },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  subCard: { overflow: 'hidden' },
  subWash: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70 },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  manageBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: corner.pill, backgroundColor: 'transparent', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: corner.md, borderWidth: 1, marginTop: spacing.md },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
