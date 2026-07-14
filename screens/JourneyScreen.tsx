import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
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

type FilterKey = 'all' | 'due' | 'risk' | 'done';
type SortKey = 'name' | 'consistency';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'risk', label: 'At risk' },
  { key: 'done', label: 'Done' },
];

/**
 * Journey Screen - Manage all Anchors.
 *
 * Design decisions:
 * - Shows ALL anchors (not filtered by due date)
 * - Header stats strip surfaces the day's most important signals
 * - Filter chips (All/Due/At risk/Done) + sort toggle (Name/Consistency)
 * - Tapping a row opens the dedicated edit screen
 * - Secondary + button in top-right
 * - Empty state is a forward nudge, not a dead end
 */
export default function JourneyScreen() {
  const navigation = useNavigation<JourneyScreenNavigationProp>();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [anchorLastCheckins, setAnchorLastCheckins] = useState<Record<string, Date | null>>({});
  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const { isDark } = useTheme();

  const bg = isDark ? colors.dark.background : colors.light.background;
  const surface = isDark ? colors.dark.surface : colors.light.surface;
  const text = isDark ? colors.dark.text : colors.light.text;
  const textMuted = isDark ? colors.dark.textMuted : colors.light.textMuted;
  const border = isDark ? colors.dark.border : colors.light.border;

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

      const anchorsWithConsistency = anchorList.map((a) => ({
        ...a,
        consistency: consistencyById[a.id] ?? 0,
      }));
      setAnchors(anchorsWithConsistency);
      setAnchorLastCheckins(checkinDates);
    } else if (error) {
      console.warn('Failed to load anchors:', error);
      if (__DEV__) {
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#34C759', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#007AFF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'futbol', color: '#FF3B30', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
        setAnchorLastCheckins({
          '1': new Date(Date.now() - 86400000),
          '2': new Date(Date.now() - 172800000),
          '3': null,
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnchors();
  }, [loadAnchors]);

  useFocusEffect(
    useCallback(() => {
      loadAnchors();
    }, [loadAnchors])
  );

  // Status classification for a single anchor, given its last check-in.
  const getStatusKey = (item: Anchor): 'done' | 'risk' | 'due' => {
    const last = anchorLastCheckins[item.id];
    const today = new Date();
    const isDoneToday = !!last && last.toDateString() === today.toDateString();
    if (isDoneToday) return 'done';

    const daysSince = last
      ? Math.floor((today.getTime() - last.getTime()) / 86400000)
      : Infinity;
    return daysSince > 2 ? 'risk' : 'due';
  };

  // Header stats derived from current anchors.
  const stats = useMemo(() => {
    let done = 0;
    let risk = 0;
    let totalConsistency = 0;
    anchors.forEach((a) => {
      const key = getStatusKey(a);
      if (key === 'done') done += 1;
      if (key === 'risk') risk += 1;
      totalConsistency += a.consistency ?? 0;
    });
    const avg = anchors.length ? Math.round(totalConsistency / anchors.length) : 0;
    return { done, risk, avg, total: anchors.length };
  }, [anchors, anchorLastCheckins]);

  // Visible list after filter + sort.
  const visibleAnchors = useMemo(() => {
    let list = anchors;
    if (filter !== 'all') {
      list = list.filter((a) => getStatusKey(a) === filter);
    }
    const sorted = [...list];
    if (sort === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => (b.consistency ?? 0) - (a.consistency ?? 0));
    }
    return sorted;
  }, [anchors, filter, sort, anchorLastCheckins]);

  const handleEditAnchor = (anchor: Anchor) => {
    navigation.navigate('EditAnchor', { anchor });
  };

  const handleAddAnchor = () => {
    navigation.navigate('AddHabit');
  };

  const formatLastCheckin = (date: Date | null) => {
    if (!date) return 'Never';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderAnchor = ({ item }: { item: Anchor }) => {
    const key = getStatusKey(item);
    const status =
      key === 'done'
        ? { label: '✓ Done today', color: colors.success, bg: `${colors.success}20` }
        : key === 'risk'
        ? { label: 'Due · at risk', color: colors.warning, bg: `${colors.warning}20` }
        : { label: 'Due today', color: colors.neutral[600], bg: colors.neutral[200] };

    return (
      <TouchableOpacity
        style={[styles.anchorCard, { backgroundColor: surface }]}
        onPress={() => handleEditAnchor(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
        </View>

        <View style={styles.anchorInfo}>
          <Text style={[styles.anchorTitle, { color: text }]}>{item.title}</Text>
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
          <Text style={[styles.consistencyText, { color: text }]}>
            {Math.round(item.consistency ?? 0)}%
          </Text>
          <Text style={[styles.lastCheckin, { color: colors.neutral[500] }]}>
            Last: {formatLastCheckin(anchorLastCheckins[item.id])}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: text }]}>Journey</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Your anchors and routines
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAnchor} activeOpacity={0.7}>
          <FontAwesome5 name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <StatTile
          label="Done today"
          value={String(stats.done)}
          icon="check-circle"
          tint={colors.success}
          bg={`${colors.success}20`}
          onPress={() => setFilter('done')}
        />
        <StatTile
          label="At risk"
          value={String(stats.risk)}
          icon="exclamation-triangle"
          tint={colors.warning}
          bg={`${colors.warning}20`}
          onPress={() => setFilter('risk')}
        />
        <StatTile
          label="Avg consistency"
          value={`${stats.avg}%`}
          icon="chart-line"
          tint={colors.primary}
          bg={`${colors.primary}20`}
          onPress={undefined}
        />
      </View>

      {/* Filter + sort controls */}
      <View style={styles.controls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count =
              f.key === 'all'
                ? stats.total
                : anchors.filter((a) => getStatusKey(a) === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : surface,
                    borderColor: active ? colors.primary : border,
                  },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#fff' : textMuted },
                  ]}
                >
                  {f.label} {count > 0 ? count : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.sortButton, { borderColor: border }]}
          onPress={() => setSort(sort === 'name' ? 'consistency' : 'name')}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name={sort === 'name' ? 'sort-alpha-down' : 'sort-amount-down'}
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.sortText, { color: colors.primary }]}>
            {sort === 'name' ? 'Name' : 'Consistency'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleAnchors}
          keyExtractor={(item) => item.id}
          renderItem={renderAnchor}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {anchors.length === 0 ? (
                <>
                  <View style={[styles.emptyIconWrap, { backgroundColor: surface }]}>
                    <FontAwesome5 name="compass" size={40} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: text }]}>
                    Build your first anchor
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                    An anchor is a routine you return to on the days motivation runs out. Start with one.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyCta, { backgroundColor: colors.primary }]}
                    onPress={handleAddAnchor}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5 name="plus" size={14} color="#fff" style={styles.emptyCtaIcon} />
                    <Text style={styles.emptyCtaText}>Create your first anchor</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <FontAwesome5 name="check" size={36} color={colors.neutral[300]} />
                  <Text style={[styles.emptySubtitle, { color: textMuted, marginTop: spacing.lg }]}>
                    Nothing here for this filter.
                  </Text>
                </>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatTile({
  label,
  value,
  icon,
  tint,
  bg,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  tint: string;
  bg: string;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  const surface = isDark ? colors.dark.surface : colors.light.surface;
  return (
    <TouchableOpacity
      style={[styles.statTile, { backgroundColor: surface }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <FontAwesome5 name={icon as any} size={16} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.neutral[500] }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    ...baseStyles.flexCenter,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  statTile: {
    flex: 1,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    ...baseStyles.flexCenter,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.xl,
    marginBottom: spacing.md,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: spacing.xs,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    ...baseStyles.flexCenter,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
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
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    ...baseStyles.flexCenter,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    marginTop: spacing.xl,
  },
  emptyCtaIcon: {
    marginRight: spacing.sm,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
