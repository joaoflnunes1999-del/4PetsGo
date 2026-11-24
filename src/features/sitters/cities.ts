import type { City } from '@/domain/types';

/** Launch cities (no pilot city: FR + CH open). Phase 2 replaces this with address autocomplete. */
export const CITIES: readonly City[] = [
  { id: 'paris', name: 'Paris', region: 'Île-de-France', country: 'FR', lat: 48.8566, lng: 2.3522 },
  { id: 'lyon', name: 'Lyon', region: 'Auvergne-Rhône-Alpes', country: 'FR', lat: 45.764, lng: 4.8357 },
  { id: 'marseille', name: 'Marseille', region: 'Provence-Alpes-Côte d’Azur', country: 'FR', lat: 43.2965, lng: 5.3698 },
  { id: 'toulouse', name: 'Toulouse', region: 'Occitanie', country: 'FR', lat: 43.6047, lng: 1.4442 },
  { id: 'bordeaux', name: 'Bordeaux', region: 'Nouvelle-Aquitaine', country: 'FR', lat: 44.8378, lng: -0.5792 },
  { id: 'lille', name: 'Lille', region: 'Hauts-de-France', country: 'FR', lat: 50.6292, lng: 3.0573 },
  { id: 'nantes', name: 'Nantes', region: 'Pays de la Loire', country: 'FR', lat: 47.2184, lng: -1.5536 },
  { id: 'nice', name: 'Nice', region: 'Provence-Alpes-Côte d’Azur', country: 'FR', lat: 43.7102, lng: 7.262 },
  { id: 'annecy', name: 'Annecy', region: 'Auvergne-Rhône-Alpes', country: 'FR', lat: 45.8992, lng: 6.1294 },
  { id: 'geneve', name: 'Genève', region: 'Canton de Genève', country: 'CH', lat: 46.2044, lng: 6.1432 },
  { id: 'lausanne', name: 'Lausanne', region: 'Canton de Vaud', country: 'CH', lat: 46.5197, lng: 6.6323 },
  { id: 'fribourg', name: 'Fribourg', region: 'Canton de Fribourg', country: 'CH', lat: 46.8065, lng: 7.1619 },
  { id: 'neuchatel', name: 'Neuchâtel', region: 'Canton de Neuchâtel', country: 'CH', lat: 46.9918, lng: 6.931 },
  { id: 'sion', name: 'Sion', region: 'Canton du Valais', country: 'CH', lat: 46.2331, lng: 7.3606 },
  { id: 'berne', name: 'Berne', region: 'Canton de Berne', country: 'CH', lat: 46.948, lng: 7.4474 },
  { id: 'zurich', name: 'Zurich', region: 'Canton de Zurich', country: 'CH', lat: 47.3769, lng: 8.5417 },
];

const byId = new Map(CITIES.map((c) => [c.id, c]));
export const getCity = (id: string): City => byId.get(id) ?? CITIES[0];
