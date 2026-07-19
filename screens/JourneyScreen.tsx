import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, colors, corner } from '../src/constants/theme';
import { Anchor, RootStackParamList } from '../src/navigation/types';
import { supabase } from '../src/supabase/client';
import { getSessionsByAnchor, computeConsistency } from '../src/supabase/sessions';
import {
  Surface,
  IconBadge,
  ProgressRing,
  StatTile,
  SectionHeader,
  EmptyState,
  Reveal,
} from '../src/components/ui';

type FilterKey = 'all' | 'due' | 'risk' | 'done';
type SortKey = 'name' | 'consistency';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'risk', label: 'At risk' },
  { key: 'done', label: 'Done' },
];

export default function JourneyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const c = useThemeColors();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [lastCheckins, setLastCheckins] = useState<Record<string, Date | null>>({});
  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name');

  const loadAnchors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('anchors').select('*');
    if (!error && data) {
      const list = data.map((a: any) => ({
        id: a.id, title: a.title, icon: a.icon, color: a.color,
        targetDays: a.target_days, minimumDuration: a.minimum_duration, consistency: a.consistency,
      }));
      const checkins: Record<string, Date | null> = {};
      const consById: Record<string, number> = {};
      for (const anchor of list) {
        try {
          const sessions = await getSessionsByAnchor(anchor.id);
          consById[anchor.id] = computeConsistency(sessions, anchor.targetDays ?? 7);
          checkins[anchor.id] = sessions.length ? new Date(sessions[0].created_at) : null;
        } catch {
          consById[anchor.id] = 0;
          checkins[anchor.id] = null;
        }
      }
      setAnchors(list.map((a) => ({ ...a, consistency: consById[a.id] ?? 0 })));
      setLastCheckins(checkins);
    } else if (error) {
      if (__DEV__) {
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#2DD4BF', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#5B8DEF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'dumbbell', color: '#FF8A5B', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
        setLastCheckins({ '1': new Date(Date.now() - 86400000), '2': new Date(Date.now() - 172800000), '3': null });
      } else {
        setAnchors([]);
      }
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadAnchors(); }, [loadAnchors]));

  const getStatusKey = (item: Anchor): 'done' | 'risk' | 'due' => {
    const last = lastCheckins[item.id];
    const today = new Date();
    if (last && last.toDateString() === today.toDateString()) return 'done';
    const daysSince = last ? Math.floor((today.getTime() - last.getTime()) / 86400000) : Infinity;
    return daysSince > 2 ? 'risk' : 'due';
  };

  const stats = useMemo(() => {
    let done = 0, risk = 0, total = 0;
    anchors.forEach((a) => {
      const k = getStatusKey(a);
      if (k === 'done') done += 1;
      if (k === 'risk') risk += 1;
      total += a.consistency ?? 0;
    });
    return { done, risk, avg: anchors.length ? Math.round(total / anchors.length) : 0, total: anchors.length };
  }, [anchors, lastCheckins]);

  const visibleAnchors = useMemo(() => {
    let list = anchors;
    if (filter !== 'all') list = list.filter((a) => getStatusKey(a) === filter);
    const sorted = [...list];
    if (sort === 'name') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => (b.consistency ?? 0) - (a.consistency ?? 0));
    return sorted;
  }, [anchors, filter, sort, lastCheckins]);

  const formatLast = (date: Date | null) => {
    if (!date) return 'Never';
    const t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1);
    if (date.toDateString() === t.toDateString()) return 'Today';
    if (date.toDateString() === y.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleEdit = (a: Anchor) => navigation.navigate('EditAnchor', { anchor: a });
  const startSession = (a: Anchor) => navigation.navigate('session', { anchorId: a.id });

  const renderAnchor = ({ item, index }: { item: Anchor; index: number }) => {
    const key = getStatusKey(item);
    const done = key === 'done';
    const status = done
      ? { label: 'Done today', color: colors.success }
      : key === 'risk'
      ? { label: 'At risk', color: colors.warning }
      : { label: 'Due today', color: c.textMuted };
    const startColor = done ? colors.success : colors.primary;
    return (
      <Reveal delay={index * 50}>
        <Surface radius="lg" style={styles.card}>
          <TouchableOpacity onPress={() => handleEdit(item)} activeOpacity={0.7} style={styles.cardBody}>
            <IconBadge name={item.icon} color={item.color} box={44} size={20} />
            <View style={styles.cardInfo}>
              <Text style={[typography.headingSm, { color: c.text }]}>{item.title}</Text>
              <Text style={[typography.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
                {item.targetDays} days · {item.minimumDuration} min
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${status.color}1F` }]}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[typography.caption, { color: c.text, fontWeight: '700' }]}>{status.label}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <ProgressRing progress={(item.consistency ?? 0) / 100} size={48} strokeWidth={5} gradient color={item.color}>
            <Text style={[typography.caption, { color: c.text, fontWeight: '700' }]}>{Math.round(item.consistency ?? 0)}</Text>
          </ProgressRing>
          <TouchableOpacity onPress={() => startSession(item)} activeOpacity={0.8} style={[styles.startBtn, { backgroundColor: startColor }]}>
            <FontAwesome5 name={done ? 'check' : 'play'} size={16} color={colors.onAccent} style={done ? undefined : { marginLeft: 1 }} />
            <Text style={styles.startBtnText}>{done ? 'Done' : 'Start'}</Text>
          </TouchableOpacity>
        </Surface>
      </Reveal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleAnchors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Reveal>
                <View style={styles.header}>
                  <View>
                    <Text style={[typography.displayXs, { color: c.text }]}>Journey</Text>
                    <Text style={[typography.small, { color: c.textMuted, marginTop: spacing.xs }]}>Your anchors, in motion</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('AddHabit')} activeOpacity={0.7} style={[styles.addBtn, { backgroundColor: `${colors.primary}1F` }]}>
                    <FontAwesome5 name="plus" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </Reveal>

              <Reveal delay={60}>
                <View style={styles.statsRow}>
                  <StatTile label="Done today" value={stats.done} icon="check-circle" tint={colors.success} onPress={() => setFilter('done')} />
                  <StatTile label="At risk" value={stats.risk} icon="exclamation-triangle" tint={colors.warning} onPress={() => setFilter('risk')} />
                  <StatTile label="Avg" value={`${stats.avg}%`} icon="chart-line" tint={colors.primary} />
                </View>
              </Reveal>

              <Reveal delay={100}>
                <View style={styles.controls}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                    {FILTERS.map((f) => {
                      const active = filter === f.key;
                      const count = f.key === 'all' ? stats.total : anchors.filter((a) => getStatusKey(a) === f.key).length;
                      return (
                        <TouchableOpacity
                          key={f.key}
                          onPress={() => setFilter(f.key)}
                          activeOpacity={0.85}
                          style={[styles.chip, { backgroundColor: active ? colors.primary : c.surfaceAlt }]}
                        >
                          <Text style={[typography.small, { color: active ? colors.onAccent : c.textMuted, fontWeight: '600' }]}>
                            {f.label}{count > 0 ? `  ${count}` : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    onPress={() => setSort(sort === 'name' ? 'consistency' : 'name')}
                    activeOpacity={0.85}
                    style={[styles.sortBtn, { backgroundColor: c.surfaceAlt }]}
                  >
                    <FontAwesome5 name={sort === 'name' ? 'sort-alpha-down' : 'sort-amount-down'} size={13} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.primaryStrong, fontWeight: '600', marginLeft: spacing.sm }]}>
                      {sort === 'name' ? 'Name' : 'Consistency'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Reveal>

              {anchors.length > 0 && (
                <Reveal delay={140}>
                  <SectionHeader title="Active anchors" subtitle={`${anchors.length} routines`} />
                </Reveal>
              )}
            </>
          }
          renderItem={renderAnchor}
          ListEmptyComponent={() => (
            anchors.length === 0 ? (
              <EmptyState
                icon="compass"
                title="Build your first anchor"
                subtitle="An anchor is a routine you return to on the days motivation runs out. Start with one."
                cta={{ label: 'Create Anchor', onPress: () => navigation.navigate('AddHabit') }}
              />
            ) : (
              <EmptyState
                icon="search"
                title="Nothing here yet"
                subtitle="No anchors match this filter. Try a different view."
                cta={{ label: 'Clear filter', onPress: () => setFilter('all') }}
              />
            )
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  controls: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  chips: { gap: spacing.md, paddingRight: spacing.md },
  chip: { minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: corner.pill },
  sortBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: corner.pill, marginLeft: spacing.md },
  list: { paddingTop: 4, paddingBottom: spacing.xxxl },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginTop: spacing.md },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.lg },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: corner.pill, marginTop: spacing.sm, gap: spacing.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, paddingHorizontal: spacing.md, borderRadius: corner.pill, marginLeft: spacing.lg },
  startBtnText: { ...typography.small, color: colors.onAccent, fontWeight: '700', marginLeft: spacing.xs },
  loading: { paddingVertical: spacing.xxxxl },
});
