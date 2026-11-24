import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import type { PetProfile } from '@/domain/types';
import { formatAge } from '@/features/pets/age';
import { getBreed } from '@/features/pets/breeds';
import { useAppStore } from '@/store/useAppStore';
import { colors, radius, spacing } from '@/theme';

import { PetAvatar } from './PetAvatar';

/** Marketplace-style grid tile: square visual first, compact text underneath. */
export function PetTile({ pet, size, onPress }: { pet: PetProfile; size: number; onPress: () => void }) {
  const count = useAppStore((s) => s.photos.filter((p) => p.petId === pet.id).length);
  const age = formatAge(pet);
  return (
    <Pressable
      testID={`pet-card-${pet.name}`}
      accessibilityRole="button"
      accessibilityLabel={`Profil de ${pet.name}`}
      onPress={onPress}
      style={({ pressed }) => [{ width: size }, pressed ? styles.pressed : null]}>
      <View style={styles.visual}>
        <PetAvatar pet={pet} size={size} rounded={radius.md} />
        <View style={styles.count}>
          <Icon name="image" size={11} color="textInverse" />
          <Text variant="label" color="textInverse">
            {count}
          </Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {pet.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {[getBreed(pet.breedId).name, age].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

export function AddPetTile({ size, onPress }: { size: number; onPress: () => void }) {
  return (
    <Pressable
      testID="add-pet"
      accessibilityRole="button"
      accessibilityLabel="Ajouter un animal"
      onPress={onPress}
      style={({ pressed }) => [styles.add, { width: size, height: size }, pressed ? styles.pressed : null]}>
      <Icon name="plus" size={26} color="primary" />
      <Text variant="callout" color="primary">
        Ajouter un animal
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  visual: { position: 'relative' },
  count: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(23,26,24,0.6)',
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  meta: { paddingTop: spacing.sm, gap: spacing.xxs },
  add: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pressed: { opacity: 0.8 },
});
