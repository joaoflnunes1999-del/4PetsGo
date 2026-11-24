import type { Country, Currency, LevelId, ServiceType, SitterService, SizeCategory, Species } from '@/domain/types';

import {
  CURRENCY_BY_COUNTRY,
  DOG_SIZE_THRESHOLDS_KG,
  KM_RATE,
  MIN_DAILY_PRICE,
  OWNER_CLUB_DISCOUNT_RATE,
  OWNER_FEE_RATE,
  SITTER_COMMISSION_RATE,
} from './config';

export const SIZE_LABELS: Record<SizeCategory, string> = {
  cat: 'Chat',
  dogSmall: 'Petit chien (0–10 kg)',
  dogMedium: 'Chien moyen (10–25 kg)',
  dogLarge: 'Grand chien (25–40 kg)',
  dogXL: 'Très grand chien (+40 kg)',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  boarding: 'Garde chez le Pet Sitter',
  homeVisits: 'Visites à domicile',
  dogWalking: 'Promenade',
};

export const SERVICE_SHORT: Record<ServiceType, string> = {
  boarding: 'Pet Boarding',
  homeVisits: 'Home Visits',
  dogWalking: 'Dog Walking',
};

export function currencyFor(country: Country): Currency {
  return CURRENCY_BY_COUNTRY[country];
}

export function sizeCategoryFor(species: Species, weightKg?: number): SizeCategory {
  if (species === 'cat') return 'cat';
  if (weightKg == null || Number.isNaN(weightKg)) return 'dogMedium';
  if (weightKg < DOG_SIZE_THRESHOLDS_KG.small) return 'dogSmall';
  if (weightKg < DOG_SIZE_THRESHOLDS_KG.medium) return 'dogMedium';
  if (weightKg < DOG_SIZE_THRESHOLDS_KG.large) return 'dogLarge';
  return 'dogXL';
}

const isDaily = (service: ServiceType) => service === 'boarding' || service === 'homeVisits';

/** Floor below which no offer can go (PRD §3.5 rule 5). Dog walking has no floor besides being > 0. */
export function minimumPriceCents(args: { service: ServiceType; country: Country; sizes: SizeCategory[]; days: number }): number {
  if (!isDaily(args.service)) return 1;
  const grid = MIN_DAILY_PRICE[args.country];
  return args.sizes.reduce((sum, s) => sum + grid[s], 0) * args.days;
}

/** Sitter's listed price for this request (sitter rates, never below the minimum). */
export function listedPriceCents(args: {
  service: SitterService;
  country: Country;
  sizes: SizeCategory[];
  days: number;
}): number {
  const { service, country, sizes, days } = args;
  if (service.type === 'dogWalking') return (service.walkPrice ?? 0) * days;
  const grid = MIN_DAILY_PRICE[country];
  const perDay = sizes.reduce((sum, s) => sum + Math.max(service.dailyRates?.[s] ?? grid[s], grid[s]), 0);
  return perDay * days;
}

/** Dog walking travel fee for the owner ↔ sitter round trip, per walk. */
export function kmFeeCents(oneWayKm: number, country: Country, walks = 1): number {
  return Math.round(oneWayKm * 2 * KM_RATE[country]) * walks;
}

export type Quote = {
  currency: Currency;
  servicePriceCents: number;
  kmFeeCents: number;
  subtotalCents: number;
  ownerFeeCents: number;
  ownerTotalCents: number;
  sitterCommissionRate: number;
  sitterCommissionCents: number;
  sitterPayoutCents: number;
  platformRevenueCents: number;
  /** Owner Club simulation (⚠️ funding à valider). */
  ownerClubTotalCents: number;
  ownerClubSavingsCents: number;
};

export function quote(args: {
  servicePriceCents: number;
  kmFeeCents?: number;
  level: LevelId;
  country: Country;
}): Quote {
  const km = args.kmFeeCents ?? 0;
  const subtotal = args.servicePriceCents + km;
  const ownerFee = Math.round(subtotal * OWNER_FEE_RATE);
  const rate = SITTER_COMMISSION_RATE[args.level];
  const commission = Math.round(subtotal * rate);
  const clubService = Math.round(args.servicePriceCents * (1 - OWNER_CLUB_DISCOUNT_RATE));
  const clubSubtotal = clubService + km;
  const clubTotal = clubSubtotal + Math.round(clubSubtotal * OWNER_FEE_RATE);
  return {
    currency: currencyFor(args.country),
    servicePriceCents: args.servicePriceCents,
    kmFeeCents: km,
    subtotalCents: subtotal,
    ownerFeeCents: ownerFee,
    ownerTotalCents: subtotal + ownerFee,
    sitterCommissionRate: rate,
    sitterCommissionCents: commission,
    sitterPayoutCents: subtotal - commission,
    platformRevenueCents: ownerFee + commission,
    ownerClubTotalCents: clubTotal,
    ownerClubSavingsCents: subtotal + ownerFee - clubTotal,
  };
}

/** "220,50 €" (FR) · "CHF 20.20" (CH). Implemented by hand to avoid Intl differences across engines. */
export function formatMoney(cents: number, currency: Currency): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const units = Math.floor(abs / 100).toString();
  const dec = (abs % 100).toString().padStart(2, '0');
  const sep = currency === 'EUR' ? ' ' : '’';
  const grouped = units.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const sign = negative ? '−' : '';
  return currency === 'EUR' ? `${sign}${grouped},${dec} €` : `${sign}CHF ${grouped}.${dec}`;
}

/** Parses "12,50" / "12.5" / "12" → cents. Returns NaN if invalid. */
export function parseMoneyInput(text: string): number {
  const clean = text.replace(/\s|€|CHF/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN;
  return Math.round(parseFloat(clean) * 100);
}
