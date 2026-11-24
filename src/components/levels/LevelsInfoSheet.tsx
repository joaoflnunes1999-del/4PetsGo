import { ScrollView, StyleSheet, View } from 'react-native';

import { Sheet, Text } from '@/components/ui';
import type { LevelId } from '@/domain/types';
import { LEVELS } from '@/features/levels/levels';
import { SITTER_COMMISSION_RATE } from '@/features/pricing/config';
import { colors, radius, spacing } from '@/theme';

import { LevelIcon } from './LevelIcon';
import { PawCoin } from './PawCoin';

const pct = (id: LevelId) => `${Math.round(SITTER_COMMISSION_RATE[id] * 100)} %`;

/** Advantages of each level, derived from the pricing config (no hard-coded numbers). */
function advantages(id: LevelId): string[] {
  switch (id) {
    case 'beginner':
      return [`Commission 4PetsGo : ${pct(id)}`, 'Mise en avant « Nouveau » sur vos 2 premières missions (identité vérifiée)'];
    case 'master':
      return [`Commission la plus basse : ${pct(id)}`, 'Le niveau le plus valorisé de la communauté 4PetsGo'];
    default:
      return [`Commission 4PetsGo réduite à ${pct(id)}`];
  }
}

export function LevelsInfoSheet({ visible, onClose, current }: { visible: boolean; onClose: () => void; current: LevelId }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Les niveaux 4PetsGo">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <PawCoin size={20} />
          <Text variant="caption" color="textMuted" style={styles.flex}>
            Gagnez des Paw Points à chaque mission terminée. Plus votre niveau monte, plus vos avantages augmentent.
          </Text>
        </View>
        {LEVELS.map((l) => {
          const isCurrent = l.id === current;
          return (
            <View key={l.id} style={[styles.row, isCurrent ? styles.current : null]} testID={`level-info-${l.id}`}>
              <LevelIcon level={l.id} size={44} />
              <View style={styles.flex}>
                <Text variant="bodyStrong">
                  Niveau {l.rank} · {l.name}
                  {isCurrent ? '  (votre niveau)' : ''}
                </Text>
                <Text variant="caption" color="textMuted">
                  {l.minPoints === 0 ? 'Dès l’inscription' : `Dès ${l.minPoints.toLocaleString('fr-FR')} Paw Points`}
                </Text>
                {advantages(l.id).map((a) => (
                  <Text key={a} variant="caption">
                    • {a}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 520 },
  list: { gap: spacing.sm, paddingBottom: spacing.sm },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  current: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  flex: { flex: 1, gap: spacing.xxs },
});
