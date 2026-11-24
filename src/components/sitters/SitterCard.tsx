import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import type { Currency, SitterProfile } from '@/domain/types';
import { formatMoney } from '@/features/pricing/pricing';
import { getCity } from '@/features/sitters/cities';
import { formatDistance } from '@/features/sitters/geo';
import { colors, radius, spacing } from '@/theme';

import { LevelBadge } from './LevelBadge';
import { Rating } from './Rating';
import { SitterAvatar } from './SitterAvatar';

type Props = {
  sitter: SitterProfile;
  distanceKm: number;
  boosted: boolean;
  priceCents?: number;
  extraCents?: number;
  currency: Currency;
  selected: boolean;
  onToggle: () => void;
  onPress: () => void;
};

export function SitterCard({ sitter, distanceKm, boosted, priceCents, extraCents, currency, selected, onToggle, onPress }: Props) {
  return (
    <Card onPress={onPress} style={[styles.card, selected ? styles.selected : null]} testID={`sitter-card-${sitter.id}`} accessibilityLabel={`Profil de ${sitter.firstName}`}>
      <View style={styles.row}>
        <SitterAvatar sitter={sitter} size={56} />
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text variant="title">{sitter.firstName}</Text>
            {boosted ? <Badge label="NOUVEAU" tone="accent" icon="zap" /> : null}
          </View>
          <Text variant="caption" color="textMuted">
            {getCity(sitter.cityId).name} · {formatDistance(distanceKm)}
          </Text>
          <Rating sitter={sitter} />
        </View>
        <Pressable
          testID={`select-${sitter.id}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={`Ajouter ${sitter.firstName} à ma demande`}
          hitSlop={10}
          onPress={onToggle}
          style={[styles.check, selected ? styles.checkOn : null]}>
          {selected ? <Icon name="check" size={18} color="textInverse" /> : null}
        </Pressable>
      </View>
      <View style={styles.footer}>
        <LevelBadge pawPoints={sitter.pawPoints} />
        {priceCents != null ? (
          <View style={styles.price}>
            <Text variant="number">{formatMoney(priceCents + (extraCents ?? 0), currency)}</Text>
            <Text variant="caption" color="textMuted">
              {extraCents ? 'avec déplacement' : 'pour la demande'}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderWidth: 1.5, borderColor: 'transparent' },
  selected: { borderColor: colors.primary },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  body: { flex: 1, gap: spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  check: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { alignItems: 'flex-end' },
});
