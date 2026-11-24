import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/ui';
import type { SitterProfile } from '@/domain/types';
import { getCity } from '@/features/sitters/cities';
import { SERVICE_NAMES, sitterHighlights } from '@/features/sitters/facts';
import { formatDistance } from '@/features/sitters/geo';
import { colors, radius, spacing } from '@/theme';

import { LevelBadge } from './LevelBadge';
import { Rating } from './Rating';
import { SitterAvatar } from './SitterAvatar';

type Props = {
  sitter: SitterProfile;
  distanceKm: number;
  boosted: boolean;
  selected: boolean;
  onToggle: () => void;
  onPress: () => void;
};

/** Result card: identity, then the living-situation highlights owners care about. No price (negotiated per request). */
export function SitterCard({ sitter, distanceKm, boosted, selected, onToggle, onPress }: Props) {
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
      <View style={styles.tags}>
        {sitterHighlights(sitter).map((h) => (
          <View key={h} style={styles.tag}>
            <Text variant="caption" color="text">
              {h}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <LevelBadge pawPoints={sitter.pawPoints} />
        <View style={styles.services}>
          {sitter.services.map((s) => (
            <Icon key={s.type} name={SERVICE_NAMES[s.type].icon} size={16} color="primary" />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  selected: { borderColor: colors.action },
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
  checkOn: { backgroundColor: colors.action, borderColor: colors.action },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.brandTint, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  services: { flexDirection: 'row', gap: spacing.sm },
});
