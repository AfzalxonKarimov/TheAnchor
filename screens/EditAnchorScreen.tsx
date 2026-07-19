import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { FontAwesome5 } from '@expo/vector-icons';
import { AchievementGlyph } from '../src/components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { updateAnchor, deleteAnchor } from '../src/supabase/anchors';
import { spacing, typography, colors, corner, baseStyles } from '../src/constants/theme';
import { Anchor } from '../src/navigation/types';

// Icon + color choices for an anchor's identity. FA5 only (per design system),
// colors are identity (not status), so a curated palette is intentional.
const ICON_OPTIONS = [
  'anchor', 'futbol', 'leaf', 'book', 'pencil-alt', 'code',
  'shoe-prints', 'heart', 'tint', 'graduation-cap', 'bullseye', 'pen',
  'utensils', 'moon', 'bolt', 'dumbbell', 'running', 'music',
];

const COLOR_OPTIONS = [
  colors.primary, '#34C759', '#FF3B30', '#FF9500', '#5856D6',
  '#AF52DE', '#FF2D55', '#5AC8FA', '#8E8E93',
];

interface EditAnchorScreenProps {
  route: {
    params: {
      anchor: Anchor;
    };
  };
  navigation: any;
}

/**
 * Edit Anchor Screen - a dedicated, pre-filled form for one anchor.
 *
 * Design decisions:
 * - No template grid: you edit THIS anchor's fields directly (fixes the
 *   confusing "re-pick a template to edit" flow).
 * - Icon + color pickers let you change identity; state/status stays computed.
 * - Delete lives here (destructive, confirmed), and only here.
 */
export default function EditAnchorScreen({ route, navigation }: EditAnchorScreenProps) {
  const { anchor } = route.params;
  const { isDark } = useTheme();

  const [title, setTitle] = useState(anchor.title);
  const [icon, setIcon] = useState(anchor.icon || 'anchor');
  const [color, setColor] = useState(anchor.color || colors.primary);
  const [duration, setDuration] = useState(String(anchor.minimumDuration ?? 15));
  const [days, setDays] = useState(String(anchor.targetDays ?? 7));

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const busy = isSaving || isDeleting;

  const bg = isDark ? colors.dark.background : colors.light.background;
  const surface = isDark ? colors.dark.surface : colors.light.surface;
  const text = isDark ? colors.dark.text : colors.light.text;
  const textMuted = isDark ? colors.dark.textMuted : colors.light.textMuted;
  const border = isDark ? colors.dark.border : colors.light.border;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Name required', 'Please enter an anchor name.');
      return;
    }

    const targetDays = Math.min(7, Math.max(1, parseInt(days, 10) || 7));
    const minimumDuration = Math.max(1, parseInt(duration, 10) || 15);

    setIsSaving(true);
    try {
      await updateAnchor(anchor.id, {
        title: title.trim(),
        icon,
        color,
        targetDays,
        minimumDuration,
      });

      if (Platform.OS !== 'web' && Haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          console.warn('Haptic feedback failed:', e);
        }
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to update anchor:', error);
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Anchor',
      `Delete "${anchor.title}"? This also removes its check-in history and can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAnchor(anchor.id);

              if (Platform.OS !== 'web' && Haptics) {
                try {
                  await Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                } catch (e) {
                  console.warn('Haptic feedback failed:', e);
                }
              }

              navigation.goBack();
            } catch (error: any) {
              console.error('Failed to delete anchor:', error);
              Alert.alert('Error', error.message || 'Failed to delete anchor');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FontAwesome5 name="times" size={20} color={textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>Edit Anchor</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Live preview */}
        <View style={styles.previewWrap}>
          <View style={[styles.previewIcon, { backgroundColor: `${color}20` }]}>
            <FontAwesome5 name={icon as any} size={30} color={color} />
          </View>
          <Text style={[styles.previewTitle, { color: text }]} numberOfLines={1}>
            {title.trim() || 'Your anchor'}
          </Text>
        </View>

        {/* Name */}
        <Text style={[styles.label, { color: textMuted }]}>NAME</Text>
        <TextInput
          style={[styles.input, { backgroundColor: surface, color: text, borderColor: border }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Anchor name"
          placeholderTextColor={colors.neutral[400]}
          returnKeyType="done"
        />

        {/* Icon picker */}
        <Text style={[styles.label, { color: textMuted }]}>ICON</Text>
        <View style={styles.pickerGrid}>
          {ICON_OPTIONS.map((opt) => {
            const selected = opt === icon;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setIcon(opt)}
                activeOpacity={0.7}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor: selected ? `${color}20` : surface,
                    borderColor: selected ? color : 'transparent',
                  },
                ]}
              >
                <FontAwesome5
                  name={opt as any}
                  size={18}
                  color={selected ? color : textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Color picker */}
        <Text style={[styles.label, { color: textMuted }]}>COLOR</Text>
        <View style={styles.pickerRow}>
          {COLOR_OPTIONS.map((opt) => {
            const selected = opt === color;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setColor(opt)}
                activeOpacity={0.7}
                style={[
                  styles.colorOption,
                  { backgroundColor: opt, borderColor: selected ? text : 'transparent' },
                ]}
              >
                {selected && <AchievementGlyph name="check" size={12} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration + days */}
        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <Text style={[styles.label, { color: textMuted }]}>MIN / SESSION</Text>
            <TextInput
              style={[styles.input, { backgroundColor: surface, color: text, borderColor: border }]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
          <View style={styles.numberField}>
            <Text style={[styles.label, { color: textMuted }]}>DAYS / WEEK</Text>
            <TextInput
              style={[styles.input, { backgroundColor: surface, color: text, borderColor: border }]}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              placeholder="7"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, busy && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={busy}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={busy}
          activeOpacity={0.7}
        >
          <FontAwesome5
            name="trash-alt"
            size={15}
            color={colors.error}
            style={styles.deleteIcon}
          />
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Deleting…' : 'Delete Anchor'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    ...baseStyles.flexCenter,
  },
  headerTitle: {
    ...typography.heading,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    ...baseStyles.flexCenter,
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.heading,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: corner.xs,
    padding: 14,
    ...typography.body,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: corner.field,
    borderWidth: 2,
    ...baseStyles.flexCenter,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: corner.control,
    borderWidth: 2,
    ...baseStyles.flexCenter,
  },
  numberRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  numberField: {
    flex: 1,
  },
  saveButton: {
    borderRadius: corner.field,
    padding: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.onAccent,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  deleteIcon: {
    marginRight: spacing.sm,
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.errorStrong,
    fontWeight: '600',
  },
});
