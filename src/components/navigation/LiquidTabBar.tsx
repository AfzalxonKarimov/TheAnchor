import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/ThemeProvider';
import { useThemeColors } from '../../theme/useThemeColors';
import { navigationTokens, liquidGlass } from '../../constants/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { supabase } from '../../supabase/client';
import { getTodaySessions } from '../../supabase/sessions';
import { Anchor } from '../../navigation/types';

import { GlassSurface } from './GlassSurface';
import { LiquidTabButton } from './LiquidTabButton';
import { LiquidGlassButton } from './LiquidGlassButton';

// Per-route icon + label. Icons alone aren't self-explanatory, so labels keep
// every tab discoverable.
const TAB_META: Record<string, { label: string; icon: string }> = {
  index: { label: 'Home', icon: 'home' },
  journey: { label: 'Journey', icon: 'compass' },
  progress: { label: 'Progress', icon: 'chart-bar' },
  profile: { label: 'Profile', icon: 'user' },
};

/**
 * Custom floating Liquid Glass tab bar.
 *
 *  - A single glass capsule floats above the bottom safe area with side
 *    margins (never touching screen edges).
 *  - Five equal columns: [Home] [Journey] [center check-in] [Progress]
 *    [Profile] — every button occupies the same slot width.
 *  - A liquid glass bead glides behind the active icon (spring glide + a
 *    subtle mid-travel stretch that reads as a liquid morph), instead of
 *    blinking in and out.
 *  - All motion is driven by Reanimated shared values, so tab changes cause
 *    no React re-renders and stay at 60fps. Reduced-motion users get snapped
 *    transitions. On open, the nav fades upward.
 */
export function LiquidTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const c = useThemeColors();
  const reduced = useReducedMotion();

  const routes = state.routes;
  const g = isDark ? liquidGlass.dark : liquidGlass.light;

  // Shared, continuous tab position. The bead and every tab derive from it.
  const progress = useSharedValue(state.index);
  // Row width — the bead centers are derived *deterministically* from it (5
  // equal columns with the middle slot reserved) instead of measuring each tab
  // via onLayout. The old measurement approach drifted out of sync and parked
  // the bead on the wrong (left) tab for every tab except the last.
  const rowWidth = useSharedValue(0);
  const rowHeight = useSharedValue<number>(navigationTokens.capsuleHeight);
  const visible = useSharedValue(0); // bead hidden until first measurement

  // Entrance animation (fade + slide up).
  const enterOpacity = useSharedValue(reduced ? 1 : 0);
  const enterY = useSharedValue(reduced ? 0 : navigationTokens.enterOffset);

  // ── Anchor / check-in state (ported from the previous tab bar) ──────────
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);

  const loadAnchors = useCallback(async () => {
    try {
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
      } else {
        setAnchors([]);
      }
    } catch (e) {
      console.warn('Error loading anchors:', e);
      setAnchors([]);
    }
  }, []);

  const loadTodaySessions = useCallback(async () => {
    try {
      const sessions = await getTodaySessions();
      setTodaySessions(sessions || []);
    } catch (e) {
      console.warn('Error loading today sessions:', e);
      setTodaySessions([]);
    }
  }, []);

  useEffect(() => {
    loadAnchors();
    loadTodaySessions();
  }, [loadAnchors, loadTodaySessions]);

  // Glide the bead when the active tab changes.
  useEffect(() => {
    const target = state.index;
    if (reduced) {
      progress.value = target;
      return;
    }
    progress.value = withSpring(target, navigationTokens.indicatorSpring);
  }, [state.index, reduced, progress]);

  // Entrance.
  useEffect(() => {
    if (reduced) {
      enterOpacity.value = 1;
      enterY.value = 0;
      return;
    }
    enterOpacity.value = withTiming(1, { duration: 320 });
    enterY.value = withSpring(0, { damping: 20, stiffness: 220 });
  }, [reduced, enterOpacity, enterY]);

  const anchorsDueToday = anchors.filter(
    (anchor) => !todaySessions.some((s) => s.anchor_id === anchor.id)
  );

  const handleFloatingPress = () => {
    if (anchorsDueToday.length === 0) {
      navigation.navigate('index');
      return;
    }
    if (anchorsDueToday.length === 1) {
      navigation.navigate('session' as never, { anchorId: anchorsDueToday[0].id } as never);
    } else {
      setModalVisible(true);
    }
  };

  const handleSelectAnchor = (anchor: Anchor) => {
    setModalVisible(false);
    navigation.navigate('session' as never, { anchorId: anchor.id } as never);
  };

  // ── Animated styles ────────────────────────────────────────────────────
  const indicatorStyle = useAnimatedStyle(() => {
    'worklet';
    // Five equal columns: [Home] [Journey] [∅ middle] [Progress] [Profile].
    // Indices 0,1 map to columns 0,1; indices 2,3 skip the reserved middle
    // column and map to columns 3,4. Center = (column + 0.5) / 5 of the row.
    const w = rowWidth.value;
    const columnOf = (i: number) => (i < 2 ? i : i + 1);
    const cs: number[] = [0, 1, 2, 3].map((i) => ((columnOf(i) + 0.5) / 5) * w);
    const x = interpolate(progress.value, [0, 1, 2, 3], cs, Extrapolate.CLAMP);
    const frac = progress.value - Math.floor(progress.value);
    const stretch = reduced ? 1 : 1 + 0.16 * Math.sin(frac * Math.PI);
    const cy = rowHeight.value / 2 - navigationTokens.iconBlockOffset;
    return {
      opacity: visible.value,
      transform: [
        { translateX: x - navigationTokens.indicatorWidth / 2 },
        { translateY: cy - navigationTokens.indicatorHeight / 2 },
        { scaleX: stretch },
      ],
    };
  });

  const enterStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  const w = navigationTokens.indicatorWidth;
  const h = navigationTokens.indicatorHeight;

  return (
    <>
      <View
        style={[
          styles.outer,
          {
            bottom: insets.bottom + navigationTokens.bottomMargin,
            left: navigationTokens.horizontalMargin,
            right: navigationTokens.horizontalMargin,
          },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.enterWrap, enterStyle]}>
          <GlassSurface style={styles.capsule}>
            <View
              style={styles.row}
              onLayout={(e) => {
                rowHeight.value = e.nativeEvent.layout.height;
                rowWidth.value = e.nativeEvent.layout.width;
                if (visible.value === 0) visible.value = 1;
              }}
            >
              {/* Liquid bead — first child so it paints *behind* the icons. */}
              <Animated.View
                style={[
                  styles.indicator,
                  { width: w, height: h, borderRadius: h / 2 },
                  indicatorStyle,
                ]}
                pointerEvents="none"
              >
                <GlassSurface
                  blur={false}
                  radius={h / 2}
                  fillOverride={g.indicatorFill}
                  borderOverride={g.indicatorBorder}
                  style={StyleSheet.absoluteFill}
                  sheenBoost={1.2}
                  shadowOpacityOverride={0.18}
                  shadowRadiusOverride={14}
                />
              </Animated.View>

              {/* Left tabs. */}
              {routes.slice(0, 2).map((route: any, i: number) => (
                <LiquidTabButton
                  key={route.key}
                  index={i}
                  label={TAB_META[route.name]?.label ?? route.name}
                  iconName={TAB_META[route.name]?.icon ?? 'circle'}
                  progress={progress}
                  onPress={() => navigation.navigate(route.name)}
                  reduced={reduced}
                />
              ))}

              {/* Reserved middle column — the crowned center button floats
                  above it, so the capsule stays symmetric (5 equal columns). */}
              <View style={styles.middleSlot} />

              {/* Right tabs. */}
              {routes.slice(2).map((route: any, i: number) => {
                const actualIndex = i + 2;
                return (
                  <LiquidTabButton
                    key={route.key}
                    index={actualIndex}
                    label={TAB_META[route.name]?.label ?? route.name}
                    iconName={TAB_META[route.name]?.icon ?? 'circle'}
                    progress={progress}
                    onPress={() => navigation.navigate(route.name)}
                    reduced={reduced}
                  />
                );
              })}
            </View>
          </GlassSurface>

          {/* Crowned center button — seated *inside* the capsule, vertically
              centered so it lines up with the other tabs (no longer floating
              above the bar). */}
          <View style={[styles.crown, { top: (navigationTokens.capsuleHeight - navigationTokens.centerButtonSize) / 2 }]}>
            <LiquidGlassButton
              done={anchors.length > 0 && anchorsDueToday.length === 0}
              onPress={handleFloatingPress}
              reduced={reduced}
            />
          </View>
        </Animated.View>
      </View>

      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <AnchorSelectionModal
          anchors={anchorsDueToday}
          c={c}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectAnchor}
        />
      </Modal>
    </>
  );
}

function AnchorSelectionModal({
  anchors,
  c,
  onClose,
  onSelect,
}: {
  anchors: Anchor[];
  c: any;
  onClose: () => void;
  onSelect: (anchor: Anchor) => void;
}) {
  return (
    <View style={styles.modalContainer}>
      <View style={styles.backdrop} />
      <View style={[styles.grabIndicator, { backgroundColor: c.textMuted }]} />

      <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: c.hairline }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Select Anchor</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: c.accentStrong }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={anchors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.modalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.anchorItem, { borderColor: item.color, backgroundColor: c.surface }]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.anchorIcon, { backgroundColor: `${item.color}20` }]}>
                <FontAwesome5 name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.anchorInfo}>
                <Text style={[styles.anchorTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.anchorDetails, { color: c.textMuted }]}>
                  {item.targetDays} days • {item.minimumDuration} min
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyAnchors}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                No anchors yet. Create one in Journey.
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
  },
  enterWrap: {
    // Positioning context for the crowned center button.
    position: 'relative',
  },
  capsule: {
    // Capsule owns the dynamic shadow; blur is clipped to its rounded bounds.
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: navigationTokens.capsuleHeight,
  },
  middleSlot: {
    flex: 1,
  },
  crown: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: navigationTokens.centerButtonSize,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  grabIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalList: {
    padding: 24,
    paddingBottom: 100,
  },
  anchorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 24,
    marginBottom: 16,
  },
  anchorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  anchorInfo: { flex: 1 },
  anchorTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  anchorDetails: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyAnchors: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
