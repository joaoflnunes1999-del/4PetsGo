import type { GeoPoint, ServiceType, SitterProfile, SizeCategory, Species } from '@/domain/types';

import { distanceKm } from './geo';

export type SearchCriteria = {
  service: ServiceType;
  species: Species[];
  sizes: SizeCategory[];
  dates: string[]; // ISO days covered by the request
  origin: GeoPoint;
  /** Max distance the owner is ready to travel for boarding. */
  ownerRadiusKm?: number;
};

export type RankedSitter = {
  sitter: SitterProfile;
  distanceKm: number;
  score: number;
  boosted: boolean;
};

export const NEW_SITTER_BOOST_MISSIONS = 2;

const WEIGHTS = { proximity: 0.55, rating: 0.25, paw: 0.08, boost: 0.1 } as const;

export function isEligible(s: SitterProfile, c: SearchCriteria, d: number): boolean {
  if (!s.services.some((x) => x.type === c.service)) return false;
  if (!c.species.every((sp) => s.acceptedSpecies.includes(sp))) return false;
  if (!c.sizes.every((sz) => s.acceptedSizes.includes(sz))) return false;
  if (c.dates.some((day) => s.unavailableDates.includes(day))) return false;
  const maxD = c.service === 'boarding' ? (c.ownerRadiusKm ?? 30) : s.radiusKm;
  return d <= maxD;
}

/**
 * Ranking (PRD §3.4): eligibility (service + availability + pet compatibility) is a hard filter,
 * then proximity dominates, then reviews, then Paw Points as a tie-breaker.
 * New Sitter Boost is a bounded bonus: it can never beat a clearly closer profile.
 */
export function rankSitters(sitters: SitterProfile[], c: SearchCriteria): RankedSitter[] {
  const withD = sitters.map((s) => ({ s, d: distanceKm(c.origin, s.location) })).filter(({ s, d }) => isEligible(s, c, d));
  const maxD = Math.max(1, ...withD.map((x) => x.d));
  return withD
    .map(({ s, d }) => {
      const boosted = s.identityVerified && s.completedMissions < NEW_SITTER_BOOST_MISSIONS;
      const proximity = 1 - d / Math.max(maxD, 10);
      const rating = s.reviewCount > 0 && s.rating != null ? s.rating / 5 : 0.7;
      const paw = Math.min(s.pawPoints / 3000, 1);
      const score =
        WEIGHTS.proximity * proximity + WEIGHTS.rating * rating + WEIGHTS.paw * paw + (boosted ? WEIGHTS.boost : 0);
      return { sitter: s, distanceKm: d, score, boosted };
    })
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
}

/** ISO dates for [start, start + days). */
export function datesCovered(startIso: string, days: number): string[] {
  const out: string[] = [];
  const start = new Date(`${startIso}T12:00:00Z`);
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
