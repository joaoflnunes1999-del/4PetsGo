import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { PetProfile } from '@/domain/types';
import { formatAge } from '@/features/pets/age';
import { getBreed } from '@/features/pets/breeds';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, shadow, spacing } from '@/theme';

import { PetAvatar } from './PetAvatar';

/** Grid tile: circular profile photo (brand rule), name and breed underneath. */
export function PetTile({ pet, size, onPress }: { pet: PetProfile; size: number; onPress: () => void }) {
  const count = useAppStore((s) => s.photos.filter((p) => p.petId === pet.id).length);
  const age = formatAge(pet);
  const photo = Math.min(size - spacing.xl, 150);
  return (
    <Pressable
      testID={`pet-card-${pet.name}`}
      accessibilityRole="button"
      accessibilityLabel={`Profil de ${pet.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width: size }, pressed ? styles.pressed : null]}>
      <View style={styles.ring}>
        <PetAvatar pet={pet} size={photo} />
      </View>
      <View style={styles.meta}>
        <Text variant="title" numberOfLines={1} align="center">
          {pet.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1} align="center">
          {[getBreed(pet.breedId).name, age].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.count}>
          <Icon name="image" size={12} color="textMuted" />
          <Text variant="caption" color="textMuted">
            {count} photo{count > 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function AddPetTile({ size, onPress }: { size: number; onPress: () => void }) {
  const photo = Math.min(size - spacing.xl, 150);
  return (
    <Pressable
      testID="add-pet"
      accessibilityRole="button"
      accessibilityLabel="Ajouter un animal"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width: size }, pressed ? styles.pressed : null]}>
      <View style={[styles.add, { width: photo + 8, height: photo + 8 }]}>
        <Icon name="plus" size={28} color="primary" />
      </View>
      <View style={styles.meta}>
        <Text variant="title" color="primary" align="center">
          Ajouter un animal
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  ring: { padding: 4, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.brand },
  meta: { paddingTop: spacing.md, gap: spacing.xxs, alignSelf: 'stretch', alignItems: 'center' },
  count: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  add: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
