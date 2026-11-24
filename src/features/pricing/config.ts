import type { Country, Currency, LevelId, SizeCategory } from '@/domain/types';

/**
 * Pricing configuration (PRD §3.6). Will move to the `pricing_config` table in phase 2.
 * All amounts are integer cents.
 */
export const CURRENCY_BY_COUNTRY: Record<Country, Currency> = { FR: 'EUR', CH: 'CHF' };

/** Minimum daily price per pet, for boarding and home visits. CH = round10(round10(FR × 4000/1350) × 0.8) — values validated by the founder. */
export const MIN_DAILY_PRICE: Record<Country, Record<SizeCategory, number>> = {
  FR: { cat: 850, dogSmall: 900, dogMedium: 1100, dogLarge: 1300, dogXL: 1700 },
  CH: { cat: 2020, dogSmall: 2140, dogMedium: 2610, dogLarge: 3080, dogXL: 4030 },
};

/** Dog walking travel fee, per km, applied to the owner ↔ sitter round trip. */
export const KM_RATE: Record<Country, number> = { FR: 37, CH: 45 };

/** Fixed platform fee paid by the owner on top of the service price. */
export const OWNER_FEE_RATE = 0.05;

/** Commission deducted from the sitter payout, by level. */
export const SITTER_COMMISSION_RATE: Record<LevelId, number> = {
  beginner: 0.05,
  explorer: 0.04,
  advanced: 0.03,
  expert: 0.02,
  master: 0.01,
};

/** ⚠️ À valider (PRD §8 risk 1): how the 10 % discount is funded. Simulation only in phase 1. */
export const OWNER_CLUB_DISCOUNT_RATE = 0.1;
export const OWNER_CLUB_YEARLY_PRICE: Record<Country, number> = { FR: 4999, CH: 4999 };

export const NEGOTIATION = {
  /** Max offers each party can make in one thread (the owner's initial request counts as one). */
  maxOffersPerParty: 3,
  offerTtlHours: 48,
} as const;

/** Weight thresholds (kg) → size category. Upper bounds are exclusive. */
export const DOG_SIZE_THRESHOLDS_KG = { small: 10, medium: 25, large: 40 } as const;
