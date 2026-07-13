import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../src/navigation/types';

type JourneyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';
import { supabase } from '../src/supabase/client';
import { getSessionsByAnchor, computeConsistency } from '../src/supabase/sessions';

/**
 * Journey Screen - Manage all Anchors.
 *
 * Design decisions:
 * - Shows ALL anchors (not filtered by due date)
 * - Each row shows anchor name, consistency score, last check-in date
 * - Tapping a row opens anchor edit screen
 * - Secondary + button in top-right (not floating)
 * - Empty state with clear call to action
 */
export default function JourneyScreen() {
  const navigation = useNavigation<JourneyScreenNavigationProp>();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [anchorLastCheckins, setAnchorLastCheckins] = useState<Record<string, Date | null>>({});
  const [isLoading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const loadAnchors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('anchors').select('*');
    if (!error && data) {
      const anchorList = data.map((a: any) => ({
        id: a.id,
        title: a.title,
        icon: a.icon,
        color: a.color,
        targetDays: a.target_days,
        minimumDuration: a.minimum_duration,
        consistency: a.consistency,
      }));

      // Load last check-in dates AND a real consistency score for each anchor.
      // Sessions are already fetched per anchor, so consistency reuses them (no extra queries).
      const checkinDates: Record<string, Date | null> = {};
      const consistencyById: Record<string, number> = {};
      for (const anchor of anchorList) {
        try {
          const sessions = await getSessionsByAnchor(anchor.id);
          consistencyById[anchor.id] = computeConsistency(sessions, anchor.targetDays ?? 7);
          if (sessions && sessions.length > 0) {
            checkinDates[anchor.id] = new Date(sessions[0].created_at);
          } else {
            checkinDates[anchor.id] = null;
          }
        } catch (e) {
          consistencyById[anchor.id] = 0;
          checkinDates[anchor.id] = null;
        }
      }

      // Override the (never-calculated) DB consistency with the computed score.
      const anchorsWithConsistency = anchorList.map((a) => ({
        ...a,
        consistency: consistencyById[a.id] ?? 0,
      }));
      setAnchors(anchorsWithConsistency);
      setAnchorLastCheckins(checkinDates);
    } else if (error) {
      console.warn('Failed to load anchors:', error);
      // In dev mode, show placeholder data
      if (__DEV__) {
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#34C759', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#007AFF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'futbol', color: '#FF3B30', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
        setAnchorLastCheckins({
          '1': new Date(Date.now() - 86400000), // Yesterday
          '2': new Date(Date.now() - 172800000), // 2 days ago
          '3': null, // Never
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnchors();
  }, [loadAnchors]);

  // Reload anchors when screen gains focus (e.g., after adding/editing)
  useFocusEffect(
    useCallback(() => {
      loadAnchors();
    }, [loadAnchors])
  );

  const handleEditAnchor = (anchor: Anchor) => {
    navigation.navigate('AddHabit', { anchor });
  };

  const formatLastCheckin = (date: Date | null) => {
    if (!date) return 'Never';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  // Derive the row's most important signal: done today / due / at-risk (stale).
  const getAnchorStatus = (item: Anchor) => {
    const last = anchorLastCheckins[item.id];
    const today = new Date();
    const isDoneToday = !!last && last.toDateString() === today.toDateString();

    if (isDoneToday) {
      return { label: '✓ Done today', color: colors.success, bg: `${colors.success}20` };
    }

    // "Stale" = no session in the last 3 days (or never) → at risk.
    const daysSince = last
      ? Math.floor((today.getTime() - last.getTime()) / 86400000)
      : Infinity;
    const isStale = daysSince > 2;

    return isStale
      ? { label: 'Due · at risk', color: colors.warning, bg: `${colors.warning}20` }
      : { label: 'Due today', color: colors.neutral[600], bg: colors.neutral[200] };
  };

  const renderAnchor = ({ item }: { item: Anchor }) => {
    const status = getAnchorStatus(item);
    return (
    <TouchableOpacity
      style={[styles.anchorCard, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}
      onPress={() => handleEditAnchor(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
      </View>

      <View style={styles.anchorInfo}>
        <Text style={[styles.anchorTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
          {item.title}
        </Text>
        <Text style={styles.anchorDetails}>
          {item.targetDays} days • {item.minimumDuration} min / session
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusBadgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.anchorMeta}>
        <Text style={[styles.consistencyText, { color: isDark ? colors.dark.textMuted : colors.light.textMuted }]}>
          {Math.round(item.consistency ?? 0)}%
        </Text>
        <Text style={[styles.lastCheckin, { color: colors.neutral[500] }]}>
          Last: {formatLastCheckin(anchorLastCheckins[item.id])}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  const handleAddAnchor = () => {
    navigation.navigate('AddHabit');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          Journey
        </Text>
        <Text style={styles.subtitle}>Your anchors and routines</Text>

        {/* Secondary Add Button - top right */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddAnchor}>
          <FontAwesome5 name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={anchors}
          keyExtractor={(item) => item.id}
          renderItem={renderAnchor}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <FontAwesome5 name="compass" size={48} color={colors.neutral[300]} />
              <Text style={[styles.emptyTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                No Anchors Yet
              </Text>
              <Text style={styles.emptySubtitle}>Create your first anchor to begin your journey</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    position: 'relative',
  },
  title: {
    ...typography.title,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  addButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}10`,
    ...baseStyles.flexCenter,
  },
  loadingContainer: {
    flex: 1,
    ...baseStyles.flexCenter,
  },
  list: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  anchorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    ...baseStyles.flexCenter,
    marginRight: spacing.lg,
  },
  anchorInfo: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  anchorTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  anchorDetails: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  anchorMeta: {
    alignItems: 'flex-end',
  },
  consistencyText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastCheckin: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    ...baseStyles.flexCenter,
    paddingTop: 120,
    paddingHorizontal: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});