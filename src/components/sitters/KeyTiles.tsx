import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { KeyTile } from '@/features/sitters/facts';
import { colors, radius, shadow, spacing } from '@/theme';

/** One row of 4 compact rectangles: icon + short value, no labels (details in accessibility labels). */
export function KeyTiles({ tiles }: { tiles: KeyTile[] }) {
  return (
    <View style={styles.row} testID="sitter-facts">
      {tiles.map((t) => (
        <View key={t.key} style={styles.tile} accessible accessibilityLabel={t.a11y} testID={`tile-${t.key}`}>
          <Icon name={t.icon} size={24} color="primary" />
          <Text variant="label" numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
            {t.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  value: { color: colors.text, fontSize: 13, letterSpacing: 0 },
});
