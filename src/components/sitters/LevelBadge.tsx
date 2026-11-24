import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { levelFor } from '@/features/levels/levels';
import { colors, radius, spacing } from '@/theme';

/** Level + animal emblem + Paw Points (never "XP"). */
export function LevelBadge({ pawPoints, compact }: { pawPoints: number; compact?: boolean }) {
  const level = levelFor(pawPoints);
  return (
    <View style={styles.badge} accessibilityLabel={`Niveau ${level.name}, ${pawPoints} Paw Points`}>
      <Icon name={level.icon} size={14} color="primary" />
      <Text variant="label" color="primary">
        {level.name.toUpperCase()}
      </Text>
      {!compact ? (
        <>
          <View style={styles.dot} />
          <Icon name="mci:paw" size={12} color="accentStrong" />
          <Text variant="label" color="accentStrong">
            {pawPoints.toLocaleString('fr-FR')}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.primary, opacity: 0.4 },
});
