import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { levelFor } from '@/features/levels/levels';
import { colors, radius, spacing } from '@/theme';

/** Level ("Expert", charcoal) + animal emblem + Paw Points with a filled Muted Gold paw (never "XP"). */
export function LevelBadge({ pawPoints, compact }: { pawPoints: number; compact?: boolean }) {
  const level = levelFor(pawPoints);
  return (
    <View style={styles.badge} accessibilityLabel={`Niveau ${level.name}, ${pawPoints} Paw Points`}>
      <Icon name={level.icon} size={14} color="text" />
      <Text variant="badge" color="text">
        {level.name}
      </Text>
      {!compact ? (
        <>
          <View style={styles.dot} />
          <Icon name="mci:paw" size={13} color="accent" />
          <Text variant="badge" color="text">
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
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.text, opacity: 0.35 },
});
