import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { SitterProfile } from '@/domain/types';
import { spacing } from '@/theme';

export function Rating({ sitter }: { sitter: SitterProfile }) {
  if (!sitter.reviewCount || sitter.rating == null) {
    return (
      <Text variant="caption" color="textMuted">
        Pas encore d’avis
      </Text>
    );
  }
  return (
    <View style={styles.row}>
      <Icon name="star" size={13} color="accentStrong" />
      <Text variant="caption" color="text">
        {sitter.rating.toFixed(1).replace('.', ',')}
      </Text>
      <Text variant="caption" color="textMuted">
        ({sitter.reviewCount} avis)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs + 1 } });
