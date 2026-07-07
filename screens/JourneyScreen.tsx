import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { spacing, typography, colors, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';
import { supabase } from '../src/supabase/client';

/**
 * Journey Screen - Manage all Anchors.
 *
 * Design decisions:
 * - Clean list layout with clear visual hierarchy
 * - Color-coded anchors with consistent icon styling
 * - Edit/Delete actions in a trailing menu
 * - Empty state with clear call to action
 */
export default function JourneyScreen() {
  const navigation = useNavigation();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [isLoading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleAddAnchor = () => {
    navigation.navigate('AddHabit' as never); // Using AddHabit screen for anchor creation
  };

  const loadAnchors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('anchors').select('*');
    if (!error && data) {
      setAnchors(
        data.map((a: any) => ({
          id: a.id,
          title: a.title,
          icon: a.icon,
          color: a.color,
          targetDays: a.target_days,
          minimumDuration: a.minimum_duration,
          consistency: a.consistency,
        }))
      );
    } else if (error) {
      console.warn('Failed to load anchors:', error);
      // In dev mode, show placeholder data
      if (__DEV__) {
        setAnchors([
          { id: '1', title: 'Meditate', icon: 'leaf', color: '#34C759', targetDays: 7, minimumDuration: 15, consistency: 85 },
          { id: '2', title: 'Read', icon: 'book', color: '#007AFF', targetDays: 5, minimumDuration: 20, consistency: 72 },
          { id: '3', title: 'Workout', icon: 'futbol', color: '#FF3B30', targetDays: 5, minimumDuration: 30, consistency: 90 },
        ]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnchors();
  }, [loadAnchors]);

  const handleDelete = (anchor: Anchor) => {
    Alert.alert(
      'Delete Anchor',
      `Remove "${anchor.title}" from your journey?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('anchors').delete().eq('id', anchor.id);
            if (!error) {
              setAnchors((prev) => prev.filter((a) => a.id !== anchor.id));
            }
          },
        },
      ]
    );
  };

  const renderAnchor = ({ item }: { item: Anchor }) => (
    <View style={[styles.anchorCard, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}>
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
      </View>

      <View style={styles.anchorActions}>
        <View style={[styles.consistencyBadge, { backgroundColor: `${item.color}20` }]}>
          <Text style={[styles.consistencyText, { color: item.color }]}>
            {item.consistency}%
          </Text>
        </View>

        <TouchableOpacity onPress={() => handleDelete(item)}>
          <FontAwesome5 name="trash" size={18} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
          Journey
        </Text>
        <Text style={styles.subtitle}>Your anchors and routines</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
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
          {/* Add Anchor Button */}
          <TouchableOpacity style={styles.fab} onPress={handleAddAnchor}>
            <FontAwesome5 name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </>
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
  loadingContainer: {
    flex: 1,
    ...baseStyles.flexCenter,
  },
  list: {
    padding: spacing.xl,
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
  anchorTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  anchorDetails: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  anchorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  consistencyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  consistencyText: {
    fontSize: 12,
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});