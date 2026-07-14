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
import { useTheme } from '../theme/ThemeProvider';
import { spacing, typography, colors, baseStyles } from '../constants/theme';

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  rank: string;
  xpAwarded: number;
  /** True when this level-up also crossed into a new rank (Spark → Ember, …). */
  rankChanged?: boolean;
  onContinue: () => void;
}

/**
 * LevelUpModal — the "level-up moment" shown after a check-in that crosses a
 * level threshold. Premium/minimal per the design system: one FA5 icon in a
 * tinted squircle, theme tokens only, semantic color (primary = achievement),
 * works in light and dark. No dead-end — always offers a forward action.
 */
export default function LevelUpModal({
  visible,
  level,
  rank,
  xpAwarded,
  rankChanged = false,
  onContinue,
}: LevelUpModalProps) {
  const { isDark } = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scale, opacity]);

  const theme = isDark ? colors.dark : colors.light;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            baseStyles.shadow,
            { backgroundColor: theme.surface, opacity, transform: [{ scale }] },
          ]}
        >
          {/* Tinted squircle icon */}
          <View style={styles.iconContainer}>
            <FontAwesome5 name="angle-double-up" size={30} color={colors.primary} />
          </View>

          <Text style={styles.eyebrow}>LEVEL UP</Text>

          <Text style={[styles.level, { color: theme.text }]}>Level {level}</Text>

          <Text style={[styles.rank, { color: theme.textSecondary }]}>
            {rankChanged ? `New rank · ${rank}` : `Rank · ${rank}`}
          </Text>

          <View style={[styles.xpPill, { backgroundColor: `${colors.success}1A` }]}>
            <FontAwesome5 name="bolt" size={12} color={colors.success} />
            <Text style={[styles.xpText, { color: colors.success }]}>+{xpAwarded} XP</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onContinue} activeOpacity={0.85}>
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
    ...baseStyles.flexCenter,
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: `${colors.primary}1A`,
    ...baseStyles.flexCenter,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  level: {
    ...typography.title,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  rank: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginBottom: spacing.xxl,
  },
  xpText: {
    ...typography.small,
    fontWeight: '700',
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
