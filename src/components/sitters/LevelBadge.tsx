import { StyleSheet, View } from 'react-native';

import { LevelIcon } from '@/components/levels/LevelIcon';
import { PawCoin } from '@/components/levels/PawCoin';
import { Text } from '@/components/ui';
import { levelFor } from '@/features/levels/levels';
import { colors, radius, spacing } from '@/theme';

/** Numbered level paw + level name ("Expert", charcoal) + Paw Points coin (never "XP"). */
export function LevelBadge({ pawPoints, compact }: { pawPoints: number; compact?: boolean }) {
  const level = levelFor(pawPoints);
  return (
    <View style={styles.badge} accessibilityLabel={`Niveau ${level.name}, ${pawPoints} Paw Points`}>
      <LevelIcon level={level.id} size={24} />
      <Text variant="badge" color="text">
        {level.name}
      </Text>
      {!compact ? (
        <>
          <View style={styles.dot} />
          <PawCoin size={18} />
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
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.text, opacity: 0.35 },
});
