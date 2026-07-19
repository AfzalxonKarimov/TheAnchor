import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { useThemeColors } from '../src/theme/useThemeColors';
import { FontAwesome5 } from '@expo/vector-icons';
import { AchievementGlyph } from '../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { createAnchor, updateAnchor, getAnchors } from '../src/supabase/anchors';
import { spacing, typography, colors, corner } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';

// Predefined anchor templates for users to pick from
const ANCHOR_TEMPLATES = [
  { id: '1', title: 'Workout', icon: 'futbol', color: '#FF3B30', defaultDuration: 30, defaultDays: 5 },
  { id: '2', title: 'Meditate', icon: 'leaf', color: '#34C759', defaultDuration: 15, defaultDays: 7 },
  { id: '3', title: 'Read', icon: 'book', color: '#007AFF', defaultDuration: 20, defaultDays: 6 },
  { id: '4', title: 'Journal', icon: 'pencil-alt', color: '#FF9500', defaultDuration: 10, defaultDays: 7 },
  { id: '5', title: 'Code', icon: 'code', color: '#5856D6', defaultDuration: 45, defaultDays: 5 },
  { id: '6', title: 'Walk', icon: 'shoe-prints', color: '#AF52DE', defaultDuration: 20, defaultDays: 7 },
  { id: '7', title: 'Stretch', icon: 'heart', color: '#FF2D55', defaultDuration: 10, defaultDays: 6 },
  { id: '8', title: 'Drink Water', icon: 'tint', color: '#5AC8FA', defaultDuration: 5, defaultDays: 7 },
  { id: '9', title: 'Study', icon: 'graduation-cap', color: '#007AFF', defaultDuration: 35, defaultDays: 5 },
  { id: '10', title: 'Practice', icon: 'bullseye', color: '#34C759', defaultDuration: 20, defaultDays: 5 },
  { id: '11', title: 'Write', icon: 'pen', color: '#FF9500', defaultDuration: 25, defaultDays: 4 },
  { id: '12', title: 'Clean', icon: 'trash', color: '#8E8E93', defaultDuration: 15, defaultDays: 3 },
  { id: '13', title: 'Cook', icon: 'utensils', color: '#FF3B30', defaultDuration: 30, defaultDays: 6 },
  { id: '14', title: 'Sleep Early', icon: 'moon', color: '#5856D6', defaultDuration: 8 * 60, defaultDays: 7 },
  { id: '15', title: 'No Phone', icon: 'mobile-alt', color: '#8E8E93', defaultDuration: 60, defaultDays: 7 },
  { id: '16', title: 'Deep Work', icon: 'bolt', color: '#007AFF', defaultDuration: 60, defaultDays: 4 },
];

interface AddHabitScreenProps {
  route: {
    params?: {
      anchor?: Anchor;
    };
  };
  navigation: any;
}

/**
 * Add/Edit Habit Screen - Create or edit anchors.
 *
 * Design decisions:
 * - Template-based creation for quick setup
 * - Custom form for unique anchors
 * - Same screen handles both create and edit modes
 */
export default function AddHabitScreen({ route, navigation }: AddHabitScreenProps) {
  const editingAnchor = route.params?.anchor;
  const isEditing = !!editingAnchor;

  const [isSaving, setIsSaving] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  // Lowercased titles the user already has — used to block adding a duplicate.
  const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState(editingAnchor?.title || '');
  const [customDuration, setCustomDuration] = useState(
    String(editingAnchor?.minimumDuration || 15)
  );
  const [customDays, setCustomDays] = useState(
    String(editingAnchor?.targetDays || 7)
  );
  const { isDark } = useTheme();
  const c = useThemeColors();

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Anchor' : 'Add Anchor',
    });
  }, [isEditing, navigation]);

  // Load the user's current anchors so we can prevent adding one twice.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const anchors = await getAnchors();
        if (!mounted) return;
        setExistingTitles(
          new Set(
            (anchors || []).map((a: any) => (a.title || '').trim().toLowerCase())
          )
        );
      } catch (e) {
        // Non-fatal: without this list the DB unique index still blocks dupes.
        console.warn('Failed to load existing anchors for dedupe', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectTemplate = async (template: typeof ANCHOR_TEMPLATES[0]) => {
    const finalTitle = template.title;
    console.log('handleSelectTemplate called:', finalTitle, 'isEditing:', isEditing);

    // Block duplicates when creating (editing keeps its own title).
    if (!isEditing && existingTitles.has(finalTitle.trim().toLowerCase())) {
      Alert.alert('Already added', `You already have an anchor called "${finalTitle}".`);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && editingAnchor) {
        console.log('Updating anchor:', editingAnchor.id);
        await updateAnchor(editingAnchor.id, {
          title: finalTitle,
          targetDays: template.defaultDays,
          minimumDuration: template.defaultDuration,
          color: template.color,
          icon: template.icon,
        });
      } else {
        console.log('Creating anchor:', finalTitle);
        // Try to save to Supabase, but handle dev mode gracefully
        try {
          await createAnchor({
            title: finalTitle,
            targetDays: template.defaultDays,
            minimumDuration: template.defaultDuration,
            color: template.color,
            icon: template.icon,
          });
        } catch (supabaseError: any) {
          // In dev mode without auth, Supabase will fail - that's expected
          if (__DEV__) {
            console.log('Dev mode: Supabase save failed (expected without auth):', supabaseError.message);
            // Still show success in dev mode for testing UI flow
          } else {
            throw supabaseError; // Re-throw in production
          }
        }
      }

      console.log('Anchor save flow complete');

      // Haptic feedback
      if (Platform.OS !== 'web' && Haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          console.warn('Haptic feedback failed:', e);
        }
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save anchor:', error);
      Alert.alert('Error', error.message || 'Failed to save anchor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customTitle.trim()) {
      Alert.alert('Error', 'Please enter an anchor name');
      return;
    }

    // Block duplicates when creating a new custom anchor.
    if (!isEditing && existingTitles.has(customTitle.trim().toLowerCase())) {
      Alert.alert('Already added', `You already have an anchor called "${customTitle.trim()}".`);
      return;
    }

    const customTemplate = {
      id: 'custom',
      title: customTitle.trim(),
      icon: 'anchor',
      color: colors.primary,
      defaultDuration: parseInt(customDuration, 10) || 15,
      defaultDays: parseInt(customDays, 10) || 7,
    };

    await handleSelectTemplate(customTemplate);
    setShowCustomForm(false);
  };

  const renderTemplate = ({ item }: { item: typeof ANCHOR_TEMPLATES[0] }) => {
    const alreadyAdded = !isEditing && existingTitles.has(item.title.trim().toLowerCase());
    return (
      <TouchableOpacity
        style={[
          styles.templateCard,
          { borderColor: item.color, backgroundColor: isDark ? colors.dark.surface : colors.light.surface },
          alreadyAdded && styles.templateCardDisabled,
        ]}
        onPress={() => handleSelectTemplate(item)}
        activeOpacity={isSaving || alreadyAdded ? 1 : 0.7}
        disabled={alreadyAdded}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <FontAwesome5 name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.templateInfo}>
          <Text style={[styles.templateTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>{item.title}</Text>
          <Text style={styles.templateDetails}>
            {item.defaultDays} days • {item.defaultDuration} min
          </Text>
        </View>
        {alreadyAdded && (
          <View style={styles.addedBadge}>
            <AchievementGlyph name="check" size={11} color={colors.success} />
            <Text style={styles.addedBadgeText}>Added</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FontAwesome5 name="times" size={20} color={c.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerButton} />
      </View>
      <Text style={[styles.title, { color: isDark ? colors.dark.text : colors.light.text }]}>
        {isEditing ? 'Edit Your Anchor' : 'Choose Your Anchor'}
      </Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Update your anchor routine' : 'Pick a routine to build consistency'}
      </Text>

      <FlatList
        data={ANCHOR_TEMPLATES}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      {/* Custom Anchor Button */}
      <TouchableOpacity
        style={[styles.customButton, { backgroundColor: isDark ? colors.dark.surface : colors.light.surface }]}
        onPress={() => setShowCustomForm(true)}
        activeOpacity={isSaving ? 1 : 0.7}
      >
        <Text style={[styles.customButtonText, { color: colors.primaryStrong }]}>+ Create Custom Anchor</Text>
      </TouchableOpacity>

      {/* Custom Form Modal */}
      {showCustomForm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.dark.surface : colors.light.background }]}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
              Custom Anchor
            </Text>
            <TextInput
              style={[styles.modalInput, {
                backgroundColor: isDark ? colors.dark.background : colors.light.background,
                color: isDark ? colors.dark.text : colors.light.text,
                borderColor: colors.neutral[300],
              }]}
              placeholder="Enter anchor name..."
              value={customTitle}
              onChangeText={setCustomTitle}
              autoFocus
              placeholderTextColor={colors.neutral[500]}
            />
            <View style={styles.customRow}>
              <TextInput
                style={[styles.customInput, {
                  backgroundColor: isDark ? colors.dark.background : colors.light.background,
                  color: isDark ? colors.dark.text : colors.light.text,
                  borderColor: colors.neutral[300],
                }]}
                placeholder="Duration (min)"
                value={customDuration}
                onChangeText={setCustomDuration}
                keyboardType="numeric"
                placeholderTextColor={colors.neutral[500]}
              />
              <TextInput
                style={[styles.customInput, {
                  backgroundColor: isDark ? colors.dark.background : colors.light.background,
                  color: isDark ? colors.dark.text : colors.light.text,
                  borderColor: colors.neutral[300],
                }]}
                placeholder="Days/week"
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="numeric"
                placeholderTextColor={colors.neutral[500]}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCustomForm(false)}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? colors.dark.textMuted : colors.light.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCustomSubmit}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: corner.sm,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  templateCardDisabled: {
    opacity: 0.5,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: corner.xs,
    backgroundColor: `${colors.success}20`,
  },
  addedBadgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.success,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    ...typography.headingSm,
    marginBottom: 4,
  },
  templateDetails: {
    ...typography.small,
    color: colors.neutral[500],
  },
  customButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: corner.xs,
    alignItems: 'center',
  },
  customButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    borderRadius: corner.control,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.heading,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: corner.xs,
    padding: 14,
    ...typography.body,
    marginBottom: 12,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: corner.xs,
    padding: 14,
    ...typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  modalButtonText: {
    ...typography.body,
  },
  modalButtonTextPrimary: {
    color: colors.onAccent,
    fontWeight: '600',
  },
});