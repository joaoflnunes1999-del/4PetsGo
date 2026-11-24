import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import type { PetProfile } from '@/domain/types';
import { formatAge } from '@/features/pets/age';
import { getBreed } from '@/features/pets/breeds';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';

import { PetAvatar } from './PetAvatar';

export function PetCard({ pet, onPress }: { pet: PetProfile; onPress: () => void }) {
  const count = useAppStore((s) => s.photos.filter((p) => p.petId === pet.id).length);
  const age = formatAge(pet);
  return (
    <Card onPress={onPress} style={styles.row} testID={`pet-card-${pet.name}`} accessibilityLabel={`Profil de ${pet.name}`}>
      <PetAvatar pet={pet} size={72} rounded={20} />
      <View style={styles.body}>
        <Text variant="displayS">{pet.name}</Text>
        <Text variant="callout" color="textMuted" numberOfLines={1}>
          {[getBreed(pet.breedId).name, age].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="caption" color="textSubtle">
          {count} photo{count > 1 ? 's' : ''}
        </Text>
      </View>
      <Icon name="chevron-right" color="textSubtle" />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  body: { flex: 1, gap: spacing.xxs },
});
