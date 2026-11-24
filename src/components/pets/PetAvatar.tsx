import { Image } from 'expo-image';

import type { PetProfile } from '@/domain/types';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

import { BreedImage } from './BreedImage';

type Props = { pet: PetProfile; size: number; rounded?: number };

/** Main photo if one is set, otherwise the breed library image. */
export function PetAvatar({ pet, size, rounded }: Props) {
  const photo = useAppStore((s) => (pet.mainPhotoId ? s.photos.find((p) => p.id === pet.mainPhotoId) : undefined));
  const r = rounded ?? size / 2;
  if (photo) {
    return (
      <Image
        source={{ uri: photo.uri }}
        style={{ width: size, height: size, borderRadius: r, backgroundColor: colors.surfaceMuted }}
        contentFit="cover"
        accessibilityLabel={`Photo de ${pet.name}`}
      />
    );
  }
  return <BreedImage breedId={pet.breedId} species={pet.species} size={size} rounded={r} />;
}
