import type { BookingRequest, Country, GeoPoint, PetProfile, ServiceType, SitterProfile } from '@/domain/types';
import { levelFor } from '@/features/levels/levels';
import { kmFeeCents, listedPriceCents, minimumPriceCents, quote, sizeCategoryFor, type Quote } from '@/features/pricing/pricing';
import { distanceKm } from '@/features/sitters/geo';

/** Glue between profiles and the pure pricing engine, used by search, request and negotiation screens. */
export function petSizes(pets: PetProfile[]) {
  return pets.map((p) => sizeCategoryFor(p.species, p.weightKg));
}

export function floorFor(args: { service: ServiceType; country: Country; pets: PetProfile[]; days: number }) {
  return minimumPriceCents({ service: args.service, country: args.country, sizes: petSizes(args.pets), days: args.days });
}

export function sitterListedPrice(args: { sitter: SitterProfile; service: ServiceType; country: Country; pets: PetProfile[]; days: number }) {
  const svc = args.sitter.services.find((s) => s.type === args.service);
  if (!svc) return undefined;
  return listedPriceCents({ service: svc, country: args.country, sizes: petSizes(args.pets), days: args.days });
}

/** Dog walking: km fee for the round trip, once per walk (days = number of walks). */
export function travelFee(args: { service: ServiceType; country: Country; origin: GeoPoint; sitter: SitterProfile; days: number }) {
  if (args.service !== 'dogWalking') return 0;
  return kmFeeCents(distanceKm(args.origin, args.sitter.location), args.country, args.days);
}

export function quoteFor(args: {
  request: Pick<BookingRequest, 'service' | 'country' | 'days'>;
  sitter: SitterProfile;
  priceCents: number;
  origin: GeoPoint;
}): Quote {
  return quote({
    servicePriceCents: args.priceCents,
    kmFeeCents: travelFee({ ...args.request, origin: args.origin, sitter: args.sitter }),
    level: levelFor(args.sitter.pawPoints).id,
    country: args.request.country,
  });
}
