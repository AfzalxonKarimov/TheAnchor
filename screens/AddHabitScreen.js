import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator, Platform, TextInput } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createAnchor } from '../src/supabase/anchors';

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

export default function AddHabitScreen({ navigation }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const handleSelectTemplate = async (template) => {
    if (__DEV__) {
      // In dev mode, show a success message instead of saving
      Alert.alert('Dev Mode', `Would save: ${template.title}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    setIsSaving(true);
    try {
      await createAnchor({
        title: template.title,
        targetDays: template.defaultDays,
        minimumDuration: template.defaultDuration,
        color: template.color,
        icon: template.icon,
      });

      // Haptic feedback
      if (Platform.OS !== 'web' && Haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          console.warn('Haptic feedback failed:', e);
        }
      }

      navigation.goBack();
    } catch (error) {
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

    const customTemplate = {
      title: customTitle.trim(),
      icon: 'anchor',
      color: '#007AFF',
      defaultDuration: 15,
      defaultDays: 5,
    };

    await handleSelectTemplate(customTemplate);
  };

  const renderTemplate = ({ item }) => (
    <TouchableOpacity
      style={[styles.templateCard, { borderColor: item.color }]}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={isSaving ? 1 : 0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <FontAwesome5 name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.templateInfo}>
        <Text style={styles.templateTitle}>{item.title}</Text>
        <Text style={styles.templateDetails}>
          {item.defaultDays} days • {item.defaultDuration} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Anchor</Text>
      <Text style={styles.subtitle}>Pick a routine to build consistency</Text>

      <FlatList
        data={ANCHOR_TEMPLATES}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      {/* Custom Anchor Button */}
      <TouchableOpacity
        style={styles.customButton}
        onPress={() => setShowCustomForm(true)}
        activeOpacity={isSaving ? 1 : 0.7}
      >
        <Text style={styles.customButtonText}>+ Create Custom Anchor</Text>
      </TouchableOpacity>

      {/* Custom Form Modal */}
      {showCustomForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Custom Anchor</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter anchor name..."
              value={customTitle}
              onChangeText={setCustomTitle}
              autoFocus
              placeholderTextColor="#888"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCustomForm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 16,
  },
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  templateDetails: { fontSize: 14, color: '#666' },
  customButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  customButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  modalButtonText: { color: '#666', fontSize: 16 },
  modalButtonTextPrimary: { color: '#fff', fontWeight: '600' },
});