import type { HomeDetails, ServiceType, SitterProfile } from '@/domain/types';
import type { IconName } from '@/components/ui/Icon';

export type Fact = { key: string; icon: IconName; label: string; value: string };

const GARDEN: Record<HomeDetails['garden'], string> = {
  none: 'Aucun',
  fenced: 'Jardin clôturé',
  partlyFenced: 'Jardin partiellement clôturé',
  open: 'Jardin ouvert',
};

export const SERVICE_NAMES: Record<ServiceType, { title: string; subtitle: string; icon: IconName }> = {
  boarding: { title: 'Garde à domicile', subtitle: 'Pet Boarding · votre animal séjourne chez le Pet Sitter', icon: 'home' },
  homeVisits: { title: 'Visites chez vous', subtitle: 'Home Visits · le Pet Sitter passe à votre domicile', icon: 'key' },
  dogWalking: { title: 'Promenades', subtitle: 'Dog Walking · balades et activités en extérieur', icon: 'mci:walk' },
};

/** The information owners look at first (PRD §3.3), in display order. */
export function sitterFacts(s: SitterProfile): Fact[] {
  const facts: Fact[] = [{ key: 'age', icon: 'user', label: 'Âge', value: `${s.age} ans` }];
  const h = s.home;
  if (h) {
    facts.push(
      { key: 'housing', icon: 'home', label: 'Logement', value: `${h.housing === 'house' ? 'Maison' : 'Appartement'} · ${h.surfaceM2} m²` },
      { key: 'balcony', icon: 'sun', label: 'Balcon', value: h.balcony ? 'Oui' : 'Non' },
      { key: 'garden', icon: 'mci:tree-outline', label: 'Extérieur', value: GARDEN[h.garden] },
      { key: 'children', icon: 'smile', label: 'Enfants', value: h.children ? 'Oui' : 'Non' },
      { key: 'animals', icon: 'mci:paw', label: 'Animaux au foyer', value: h.residentAnimals?.trim() || 'Aucun' },
      { key: 'separate', icon: 'git-branch', label: 'Séparation possible', value: h.canSeparate ? 'Oui' : 'Non' },
    );
  }
  facts.push({ key: 'experience', icon: 'award', label: 'Expérience', value: `${s.experienceYears} an${s.experienceYears > 1 ? 's' : ''}` });
  if (s.services.some((x) => x.type !== 'boarding')) {
    facts.push({ key: 'radius', icon: 'navigation', label: 'Se déplace jusqu’à', value: `${s.radiusKm} km` });
  }
  return facts;
}

/** Short tags for result cards: home type, outdoor, children, resident animals. */
export function sitterHighlights(s: SitterProfile): string[] {
  const out = [`${s.age} ans`];
  const h = s.home;
  if (h) {
    out.push(`${h.housing === 'house' ? 'Maison' : 'Appart.'} ${h.surfaceM2} m²`);
    if (h.garden !== 'none') out.push('Jardin');
    else if (h.balcony) out.push('Balcon');
    out.push(h.children ? 'Enfants' : 'Sans enfants');
    out.push(h.residentAnimals && !/^aucun/i.test(h.residentAnimals.trim()) ? 'Animaux au foyer' : 'Sans animaux');
  } else {
    out.push(`Se déplace ${s.radiusKm} km`);
  }
  return out;
}
