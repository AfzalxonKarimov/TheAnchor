import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '../theme/useThemeColors';
import { spacing, typography, colors, corner } from '../constants/theme';
import { FloatingParticles } from './ui';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  rank: string;
  xpAwarded: number;
  rankChanged?: boolean;
  onContinue: () => void;
}

/**
 * The "level-up moment." Premium/calm: one teal icon, spring entrance, a soft
 * particle burst, works in light + dark. Always a forward action.
 */
export default function LevelUpModal({ visible, level, rank, xpAwarded, rankChanged = false, onContinue }: LevelUpModalProps) {
  const c = useThemeColors();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [burst, setBurst] = React.useState(0);

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      setBurst((b) => b + 1);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <FloatingParticles trigger={burst} color={c.accentSoft} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <Animated.View style={[styles.card, { backgroundColor: c.surface, opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}1F`, shadowColor: colors.accentGlow, shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } }]}>
            <FontAwesome5 name="angle-double-up" size={30} color={colors.primary} />
          </View>

          <Text style={[typography.eyebrow, { color: colors.primaryStrong }]}>LEVEL UP</Text>
          <Text style={[typography.displayXs, { color: c.text, marginTop: spacing.xs }]}>Level {level}</Text>
          <Text style={[typography.body, { color: c.textSecondary, marginTop: spacing.xs }]}>
            {rankChanged ? `New rank · ${rank}` : `Rank · ${rank}`}
          </Text>

          <View style={[styles.xpPill, { backgroundColor: `${colors.success}1F` }]}>
            <FontAwesome5 name="bolt" size={13} color={colors.success} />
            <Text style={[typography.small, { color: colors.onAccent, fontWeight: '700', marginLeft: spacing.sm }]}>+{xpAwarded} XP</Text>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: corner.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: corner.pill,
    marginTop: spacing.lg,
  },
  button: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: corner.md,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  buttonText: { ...typography.body, color: colors.onAccent, fontWeight: '700' },
});
