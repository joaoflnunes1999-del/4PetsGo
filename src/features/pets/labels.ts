import type { PetProfile } from '@/domain/types';

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
