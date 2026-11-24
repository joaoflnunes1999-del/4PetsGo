import type { HomeDetails, ServiceType, SitterProfile } from '@/domain/types';
import type { IconName } from '@/components/ui/Icon';

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

export type KeyTile = { key: string; icon: IconName; value: string; a11y: string };

/**
 * The 4 essentials shown as compact tiles at the top of a sitter profile (icon + short value, no labels).
 * Boarding sitters: home type + m², outdoor, children, resident animals.
 * Others (visits / walks only): travel radius, experience, missions, max dogs or species.
 */
export function sitterKeyTiles(s: SitterProfile): KeyTile[] {
  const h = s.home;
  if (h) {
    const house = h.housing === 'house';
    const outdoor =
      h.garden !== 'none'
        ? { icon: 'mci:pine-tree' as const, value: 'Jardin', a11y: GARDEN[h.garden] }
        : h.balcony
          ? { icon: 'mci:balcony' as const, value: 'Balcon', a11y: 'Balcon, pas de jardin' }
          : { icon: 'mci:pine-tree' as const, value: 'Aucun', a11y: 'Ni jardin ni balcon' };
    const hasAnimals = !!h.residentAnimals && !/^aucun/i.test(h.residentAnimals.trim());
    return [
      {
        key: 'housing',
        icon: house ? 'mci:home-variant-outline' : 'mci:office-building-outline',
        value: `${h.surfaceM2} m²`,
        a11y: `${house ? 'Maison' : 'Appartement'} de ${h.surfaceM2} m²`,
      },
      { key: 'outdoor', ...outdoor },
      {
        key: 'children',
        icon: 'mci:human-male-girl',
        value: h.children ? 'Enfants' : 'Sans',
        a11y: h.children ? 'Enfants au domicile' : 'Pas d’enfants au domicile',
      },
      {
        key: 'animals',
        icon: hasAnimals ? 'mci:paw' : 'mci:paw-off',
        value: hasAnimals ? 'Animaux' : 'Aucun',
        a11y: hasAnimals ? `Animaux au foyer : ${h.residentAnimals}` : 'Aucun animal au foyer',
      },
    ];
  }
  const walk = s.services.find((x) => x.type === 'dogWalking');
  return [
    { key: 'radius', icon: 'mci:map-marker-radius', value: `${s.radiusKm} km`, a11y: `Se déplace jusqu’à ${s.radiusKm} km` },
    { key: 'experience', icon: 'award', value: `${s.experienceYears} an${s.experienceYears > 1 ? 's' : ''}`, a11y: `${s.experienceYears} ans d’expérience` },
    { key: 'missions', icon: 'check-circle', value: String(s.completedMissions), a11y: `${s.completedMissions} missions réalisées` },
    walk?.maxDogs
      ? { key: 'dogs', icon: 'mci:dog', value: `${walk.maxDogs} max`, a11y: `${walk.maxDogs} chiens maximum en même temps` }
      : {
          key: 'species',
          icon: s.acceptedSpecies.includes('cat') ? 'mci:cat' : 'mci:dog',
          value: s.acceptedSpecies.length > 1 ? 'Chiens, chats' : s.acceptedSpecies[0] === 'cat' ? 'Chats' : 'Chiens',
          a11y: 'Animaux acceptés',
        },
  ];
}
