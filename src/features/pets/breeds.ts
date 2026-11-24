import type { SizeCategory, Species } from '@/domain/types';

/**
 * Central breed library (PRD §3.2). Becomes the `breeds` table + Storage bucket in phase 2,
 * so images can be added/replaced without touching pet profiles.
 * `image` stays undefined until licensed studio photos (white background, 1:1) are provided;
 * the UI then falls back to the generic dog/cat visual.
 */
export type Breed = {
  id: string;
  species: Species;
  name: string;
  typicalSize?: SizeCategory;
  image?: number; // require('…png') once available
};

export const GENERIC_BREED_ID: Record<Species, string> = { dog: 'dog-mixed', cat: 'cat-mixed' };

const dog = (id: string, name: string, typicalSize: SizeCategory): Breed => ({ id: `dog-${id}`, species: 'dog', name, typicalSize });
const cat = (id: string, name: string): Breed => ({ id: `cat-${id}`, species: 'cat', name, typicalSize: 'cat' });

export const BREEDS: readonly Breed[] = [
  { id: 'dog-mixed', species: 'dog', name: 'Croisé / race inconnue' },
  dog('beagle', 'Beagle', 'dogMedium'),
  dog('berger-allemand', 'Berger allemand', 'dogLarge'),
  dog('berger-australien', 'Berger australien', 'dogMedium'),
  dog('berger-blanc-suisse', 'Berger blanc suisse', 'dogLarge'),
  dog('bichon-frise', 'Bichon frisé', 'dogSmall'),
  dog('bichon-maltais', 'Bichon maltais', 'dogSmall'),
  dog('border-collie', 'Border collie', 'dogMedium'),
  dog('bouledogue-francais', 'Bouledogue français', 'dogSmall'),
  dog('bouvier-bernois', 'Bouvier bernois', 'dogXL'),
  dog('boxer', 'Boxer', 'dogLarge'),
  dog('cavalier-king-charles', 'Cavalier King Charles', 'dogSmall'),
  dog('chihuahua', 'Chihuahua', 'dogSmall'),
  dog('cocker-anglais', 'Cocker anglais', 'dogMedium'),
  dog('dalmatien', 'Dalmatien', 'dogLarge'),
  dog('doberman', 'Dobermann', 'dogLarge'),
  dog('epagneul-breton', 'Épagneul breton', 'dogMedium'),
  dog('golden-retriever', 'Golden retriever', 'dogLarge'),
  dog('husky', 'Husky sibérien', 'dogLarge'),
  dog('jack-russell', 'Jack Russell terrier', 'dogSmall'),
  dog('labrador', 'Labrador retriever', 'dogLarge'),
  dog('malinois', 'Berger belge malinois', 'dogLarge'),
  dog('montagne-pyrenees', 'Montagne des Pyrénées', 'dogXL'),
  dog('pinscher-nain', 'Pinscher nain', 'dogSmall'),
  dog('rottweiler', 'Rottweiler', 'dogXL'),
  dog('saint-bernard', 'Saint-bernard', 'dogXL'),
  dog('shiba-inu', 'Shiba inu', 'dogMedium'),
  dog('shih-tzu', 'Shih tzu', 'dogSmall'),
  dog('spitz-nain', 'Spitz nain (Loulou de Poméranie)', 'dogSmall'),
  dog('staffordshire', 'Staffordshire bull terrier', 'dogMedium'),
  dog('teckel', 'Teckel', 'dogSmall'),
  dog('caniche', 'Caniche', 'dogSmall'),
  dog('yorkshire', 'Yorkshire terrier', 'dogSmall'),
  dog('dogue-allemand', 'Dogue allemand', 'dogXL'),
  dog('cane-corso', 'Cane corso', 'dogXL'),
  { id: 'cat-mixed', species: 'cat', name: 'Européen / race inconnue' },
  cat('abyssin', 'Abyssin'),
  cat('bengal', 'Bengal'),
  cat('british-shorthair', 'British shorthair'),
  cat('chartreux', 'Chartreux'),
  cat('exotic-shorthair', 'Exotic shorthair'),
  cat('maine-coon', 'Maine coon'),
  cat('norvegien', 'Chat des forêts norvégiennes'),
  cat('persan', 'Persan'),
  cat('ragdoll', 'Ragdoll'),
  cat('sacre-birmanie', 'Sacré de Birmanie'),
  cat('scottish-fold', 'Scottish fold'),
  cat('siamois', 'Siamois'),
  cat('sibérien', 'Sibérien'),
  cat('sphynx', 'Sphynx'),
  cat('bleu-russe', 'Bleu russe'),
];

const byId = new Map(BREEDS.map((b) => [b.id, b]));

export function getBreed(id: string): Breed {
  return byId.get(id) ?? byId.get(id.startsWith('cat') ? GENERIC_BREED_ID.cat : GENERIC_BREED_ID.dog)!;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Accent-insensitive search; generic breed always listed first. */
export function searchBreeds(species: Species, query: string): Breed[] {
  const q = normalize(query.trim());
  const list = BREEDS.filter((b) => b.species === species && (!q || normalize(b.name).includes(q)));
  return list.sort((a, b) => {
    const ga = a.id === GENERIC_BREED_ID[species] ? 0 : 1;
    const gb = b.id === GENERIC_BREED_ID[species] ? 0 : 1;
    return ga - gb || a.name.localeCompare(b.name, 'fr');
  });
}
