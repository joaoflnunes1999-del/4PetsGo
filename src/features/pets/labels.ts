import type { PetProfile, PhotoVisibility } from '@/domain/types';

export const VISIBILITY: Record<PhotoVisibility, { label: string; description: string; icon: 'globe' | 'users' | 'lock' }> = {
  public: { label: 'Public', description: 'Visibles par les utilisateurs de 4PetsGo sur le profil public de votre animal.', icon: 'globe' },
  confirmedBookings: {
    label: 'Réservations confirmées',
    description: 'Visibles uniquement par le Pet Sitter d’une réservation confirmée.',
    icon: 'users',
  },
  private: { label: 'Privé', description: 'Visibles uniquement par vous.', icon: 'lock' },
};

export const ENERGY: Record<NonNullable<PetProfile['personality']['energy']>, string> = {
  low: 'Calme',
  medium: 'Modérée',
  high: 'Très énergique',
};

export const PERSONALITY_TRAITS = [
  'Affectueux',
  'Joueur',
  'Curieux',
  'Calme',
  'Indépendant',
  'Timide',
  'Sociable',
  'Protecteur',
  'Gourmand',
  'Câlin',
  'Têtu',
  'Sensible au bruit',
] as const;
