import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { Species } from '@/domain/types';
import { getBreed } from '@/features/pets/breeds';
import { colors } from '@/theme';

type Props = { breedId: string; species: Species; size: number; rounded?: number };

/**
 * Breed library image on pure white, 1:1. Until licensed studio photos are added to the
 * breed library, a consistent generic dog/cat visual is shown (PRD §3.2 fallback).
 */
export function BreedImage({ breedId, species, size, rounded = 0 }: Props) {
  const breed = getBreed(breedId);
  if (breed.image) {
    return (
      <Image
        source={breed.image}
        style={{ width: size, height: size, borderRadius: rounded, backgroundColor: colors.photoBackdrop }}
        contentFit="contain"
        accessibilityLabel={breed.name}
      />
    );
  }
  return (
    <View
      accessibilityLabel={`Image générique ${species === 'cat' ? 'chat' : 'chien'}`}
      style={[styles.generic, { width: size, height: size, borderRadius: rounded }]}>
      <Icon name={species === 'cat' ? 'mci:cat' : 'mci:dog'} size={size * 0.56} color="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  generic: {
    backgroundColor: colors.photoBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
