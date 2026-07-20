import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../src/theme/useThemeColors';
import { FontAwesome5 } from '@expo/vector-icons';
import { AchievementGlyph } from '../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, corner, navigationTokens } from '../src/constants/theme';
import { getLevelFromXP, getRankFromLevel, getLevelProgress, getXPForNextLevel } from '../lib/leveling';
import { useAuth } from '../src/auth/AuthContext';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { getProfile, updateProfile } from '../src/supabase/profiles';
import { getPersonalRecords } from '../src/supabase/analytics';
import { useTheme } from '../src/theme/ThemeProvider';
import { supabase } from '../src/supabase/client';
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

const SHOW_SUBSCRIPTION = false; // No backend yet — hiding the phantom membership card for V1.
const NOTIFICATIONS_KEY = 'theanchor.notifications';
const SUPPORT_EMAIL = 'support@theanchor.app';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const c = useThemeColors();
  const [xp, setXp] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [records, setRecords] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Display name — single source of truth is profiles.username (same as Home).
  const [displayName, setDisplayName] = useState('there');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const { mode: themeMode, setMode: applyMode } = useTheme();

  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            setXp(profile.total_xp || 0);
            setMomentum(profile.momentum || 50);
            const rawName = profile.username || '';
            const isAutoHandle = /^user_/i.test(rawName);
            setDisplayName(!isAutoHandle && rawName ? rawName : 'there');
          }
          const rec = await getPersonalRecords();
          setRecords(rec);
          // Restore persisted notification preference.
          const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
          if (stored === 'true' || stored === 'false') setNotifications(stored === 'true');
        } catch (e) {
          console.warn('Profile load failed', e);
        }
      })();
    }, [])
  );

  const persistNotifications = (next: boolean) => {
    setNotifications(next);
    AsyncStorage.setItem(NOTIFICATIONS_KEY, String(next)).catch(() => {});
  };

  const openNameEditor = () => {
    setNameDraft(displayName === 'there' ? '' : displayName);
    setEditingName(true);
  };
  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setEditingName(false); return; }
    try {
      await updateProfile({ username: trimmed });
      setDisplayName(trimmed);
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Could not save name', e?.message || 'Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      const [{ data: anchors }, { data: sessions }, profile] = await Promise.all([
        supabase.from('anchors').select('*').eq('user_id', user!.id),
        supabase.from('sessions').select('*').eq('user_id', user!.id),
        getProfile(),
      ]);
      const payload = JSON.stringify({ profile, anchors: anchors ?? [], sessions: sessions ?? [] }, null, 2);
      await Share.share({ message: payload, title: 'TheAnchor data export' });
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || 'Please try again.');
    }
  };

  const handleHelp = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=TheAnchor%20Support`).catch(() => {
      Alert.alert('Support', `Email ${SUPPORT_EMAIL}`);
    });
  };

  // Delete the user's own data (RLS permits owner delete) then sign out.
  // NOTE: the auth user record itself requires server-side deletion (edge
  // function / admin) — out of scope for the client. This clears all personal
  // data so nothing tied to the account remains visible.
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your anchors, sessions, and profile, then signs you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            if (deleting) return;
            setDeleting(true);
            try {
              const uid = user!.id;
              await supabase.from('sessions').delete().eq('user_id', uid);
              await supabase.from('anchors').delete().eq('user_id', uid);
              await supabase.from('profiles').delete().eq('id', uid);
              await signOut();
              const rootNav = navigation.getParent() ?? navigation;
              rootNav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            } catch (e: any) {
              setDeleting(false);
              Alert.alert('Delete failed', e?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

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
                <AchievementGlyph name="anchor" size={34} color={colors.primary} />
              </View>
            </ProgressRing>
            <TouchableOpacity onPress={openNameEditor} activeOpacity={0.7}>
              <Text style={[typography.heading, { color: c.text, marginTop: spacing.xxl }]}>{displayName}</Text>
              <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>Tap to edit name</Text>
            </TouchableOpacity>
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
                <Text style={[typography.displayXxs, { color: c.text, marginTop: spacing.xs }]}>{xp}</Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: `${colors.primary}1F` }]}>
                <FontAwesome5 name="bolt" size={13} color={colors.primary} />
                <Text style={[typography.small, { color: colors.primaryStrong, fontWeight: '700', marginLeft: spacing.sm }]}>Lv {level}</Text>
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
            <StatTile label="Check-ins" value={records?.totalCheckins ?? 0} icon="check-circle" tint={colors.success} compact />
          </View>
        </Reveal>

        {/* Appearance */}
        <Reveal delay={140}>
          <Surface radius="xl" style={styles.card}>
            <SectionHeader title="Appearance" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text style={[typography.small, { color: c.text }]}>Theme</Text>
              <Segmented
                options={[
                  { key: 'light', label: 'Light' },
                  { key: 'dark', label: 'Dark' },
                  { key: 'system', label: 'System' },
                ]}
                value={themeMode}
                onChange={(k) => applyMode(k as 'light' | 'dark' | 'system')}
                style={{ width: 260 }}
              />
            </View>
          </Surface>
        </Reveal>

        {/* Preferences */}
        <Reveal delay={180}>
          <Surface radius="xl" style={styles.card}>
            <SectionHeader title="Preferences" />
            <SettingRow icon="bell" label="Notifications" isToggle value={notifications} onValueChange={persistNotifications} />
            <SettingRow
              icon="file-export"
              label="Export data"
              onPress={handleExport}
            />
            <SettingRow icon="question-circle" label="Help & Support" onPress={handleHelp} last />
          </Surface>
        </Reveal>

        {/* Subscription — calm membership card, not an ad */}
        {SHOW_SUBSCRIPTION && (
          <Reveal delay={220}>
            <Surface radius="xl" style={[styles.card, styles.subCard, { paddingVertical: spacing.xxl }]}>
              <View style={[styles.subWash, { backgroundColor: `${colors.primary}0A` }]} pointerEvents="none" />
              <View style={styles.subRow}>
                <IconBadge name="crown" color={colors.primary} box={44} size={20} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[typography.eyebrow, { color: colors.primaryStrong }]}>MEMBERSHIP</Text>
                  <Text style={[typography.heading, { color: c.text, marginTop: spacing.xs }]}>TheAnchor Plus</Text>
                  <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
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
          <TouchableOpacity onPress={handleLogout} disabled={loggingOut} activeOpacity={0.7} style={[styles.logout, { borderColor: c.hairline, marginTop: spacing.xl }]}>
            <FontAwesome5 name="sign-out-alt" size={16} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.errorStrong }]}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
          </TouchableOpacity>
        </Reveal>

        {/* Delete account */}
        <Reveal delay={280}>
          <TouchableOpacity onPress={handleDeleteAccount} disabled={deleting} activeOpacity={0.7} style={[styles.deleteBtn, { borderColor: colors.error, marginTop: spacing.md }]}>
            <FontAwesome5 name="trash-alt" size={16} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
          </TouchableOpacity>
        </Reveal>

        <Text style={[typography.caption, { color: c.textMuted, textAlign: 'center', marginTop: spacing.xl }]}>
          TheAnchor · built for the days motivation runs out
        </Text>
      </ScrollView>

      {/* Display name editor */}
      <Modal visible={editingName} transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[typography.heading, { color: c.text }]}>Display name</Text>
            <TextInput
              style={[styles.nameInput, { color: c.text, borderColor: c.hairline, backgroundColor: c.surfaceAlt }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={c.textMuted}
              autoFocus
              maxLength={40}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={styles.modalBtn} activeOpacity={0.7}>
                <Text style={[typography.body, { color: c.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveName} style={[styles.modalBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
                <Text style={[typography.body, { color: colors.onAccent, fontWeight: '700' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      <IconBadge name={icon} color={colors.primary} box={36} size={16} />
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
  scroll: { padding: spacing.xl, paddingBottom: navigationTokens.tabClearance },
  identity: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
  rankChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: corner.pill, marginTop: spacing.sm },
  card: { padding: spacing.xl, marginBottom: spacing.xxl },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: corner.pill },
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  subCard: { overflow: 'hidden' },
  subWash: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70 },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  manageBtn: { minHeight: 44, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: corner.pill, backgroundColor: 'transparent', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: corner.md, borderWidth: 1, marginTop: spacing.md },
  logoutText: { ...typography.body, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: corner.md, borderWidth: 1, marginTop: spacing.md },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: corner.xl, padding: spacing.xl },
  nameInput: { marginTop: spacing.lg, borderWidth: 1, borderRadius: corner.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, ...typography.body },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.xl },
  modalBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: corner.md },
});
