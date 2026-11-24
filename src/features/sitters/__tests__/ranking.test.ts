import type { SitterProfile } from '@/domain/types';

import { datesCovered, rankSitters } from '../ranking';

const PARIS = { lat: 48.8566, lng: 2.3522 };
// ~1 km of latitude ≈ 0.009°
const north = (km: number) => ({ lat: PARIS.lat + km * 0.009, lng: PARIS.lng });

function sitter(id: string, over: Partial<SitterProfile>): SitterProfile {
  return {
    id,
    firstName: id,
    avatarSeed: 1,
    cityId: 'paris',
    location: PARIS,
    radiusKm: 15,
    bio: '',
    experienceYears: 3,
    acceptedSpecies: ['dog', 'cat'],
    acceptedSizes: ['cat', 'dogSmall', 'dogMedium', 'dogLarge', 'dogXL'],
    services: [{ type: 'boarding', dailyRates: {} }, { type: 'homeVisits', dailyRates: {} }],
    certifications: [],
    pawPoints: 500,
    completedMissions: 10,
    rating: 4.8,
    reviewCount: 10,
    identityVerified: true,
    unavailableDates: [],
    joinedAt: '2025-01-01',
    ...over,
  };
}

const base = {
  service: 'boarding' as const,
  species: ['dog' as const],
  sizes: ['dogMedium' as const],
  dates: ['2026-12-01', '2026-12-02'],
  origin: PARIS,
};

describe('rankSitters', () => {
  it('filters out sitters without the service, with incompatible pets or unavailable', () => {
    const res = rankSitters(
      [
        sitter('ok', {}),
        sitter('noService', { services: [{ type: 'dogWalking', walkPrice: 1000 }] }),
        sitter('catsOnly', { acceptedSpecies: ['cat'] }),
        sitter('busy', { unavailableDates: ['2026-12-02'] }),
        sitter('far', { location: north(80) }),
      ],
      base,
    );
    expect(res.map((r) => r.sitter.id)).toEqual(['ok']);
  });

  it('ranks closer sitters first when profiles are similar', () => {
    const res = rankSitters([sitter('far', { location: north(12) }), sitter('near', { location: north(1) })], base);
    expect(res.map((r) => r.sitter.id)).toEqual(['near', 'far']);
  });

  it('New Sitter Boost helps a new profile but never beats a much closer one', () => {
    const newcomer = sitter('new', { location: north(4), completedMissions: 0, reviewCount: 0, rating: undefined, pawPoints: 0 });
    const veteranSame = sitter('vet', { location: north(4.5), pawPoints: 500 });
    const veteranClose = sitter('close', { location: north(0.5) });
    const ranked = rankSitters([veteranSame, newcomer], base);
    expect(ranked[0].sitter.id).toBe('new');
    expect(ranked[0].boosted).toBe(true);
    const far = rankSitters([veteranClose, { ...newcomer, location: north(14) }], base);
    expect(far[0].sitter.id).toBe('close');
  });

  it('does not boost unverified identities', () => {
    const res = rankSitters([sitter('anon', { completedMissions: 0, identityVerified: false })], base);
    expect(res[0].boosted).toBe(false);
  });
});

describe('datesCovered', () => {
  it('lists consecutive ISO days across month boundaries', () => {
    expect(datesCovered('2026-11-30', 3)).toEqual(['2026-11-30', '2026-12-01', '2026-12-02']);
  });
});
