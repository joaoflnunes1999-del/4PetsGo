import type {
  BookingRequest,
  Country,
  NegotiationThread,
  Offer,
  OfferParty,
  ServiceType,
} from '@/domain/types';
import { NEGOTIATION } from '@/features/pricing/config';
import { currencyFor } from '@/features/pricing/pricing';

/**
 * Negotiation state machine (PRD §3.5). Pure functions: every action returns a NEW request.
 * In phase 2 the same rules are enforced server-side (transactional Postgres function);
 * this module stays the client-side source for UI state.
 */

export type NegotiationErrorCode =
  | 'REQUEST_LOCKED'
  | 'REQUEST_CLOSED'
  | 'THREAD_CLOSED'
  | 'NOT_YOUR_TURN'
  | 'MAX_ROUNDS'
  | 'BELOW_MINIMUM'
  | 'INVALID_PRICE'
  | 'UNKNOWN_SITTER';

export class NegotiationError extends Error {
  constructor(public code: NegotiationErrorCode) {
    super(code);
    this.name = 'NegotiationError';
  }
}

export const NEGOTIATION_ERROR_MESSAGES: Record<NegotiationErrorCode, string> = {
  REQUEST_LOCKED: 'Cette mission a déjà été acceptée par un autre Pet Sitter.',
  REQUEST_CLOSED: 'Cette demande n’est plus active.',
  THREAD_CLOSED: 'Cette négociation est terminée.',
  NOT_YOUR_TURN: 'Vous attendez la réponse de l’autre partie.',
  MAX_ROUNDS: 'Vous avez atteint le nombre maximum de 3 propositions.',
  BELOW_MINIMUM: 'Le prix ne peut pas être inférieur au prix minimum de 4PetsGo.',
  INVALID_PRICE: 'Montant invalide.',
  UNKNOWN_SITTER: 'Pet Sitter introuvable pour cette demande.',
};

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mission identifier, e.g. `4PG-7K2Q9X`. `random` is injectable for tests. */
export function generateMissionId(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
  return `4PG-${s}`;
}

let offerSeq = 0;
const newOfferId = () => `of_${Date.now().toString(36)}_${(offerSeq++).toString(36)}`;

const addHours = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3600_000).toISOString();

function makeOffer(by: OfferParty, priceCents: number, now: string, message?: string): Offer {
  return {
    id: newOfferId(),
    by,
    priceCents,
    message,
    createdAt: now,
    expiresAt: addHours(now, NEGOTIATION.offerTtlHours),
    status: 'pending',
  };
}

export function createRequest(args: {
  ownerId: string;
  petIds: string[];
  service: ServiceType;
  startDate: string;
  days: number;
  country: Country;
  /** Initial owner offer per sitter (defaults to each sitter's listed price, computed by the caller). */
  initialPrices: Record<string, number>;
  floorCents: number;
  note?: string;
  now: string;
  id?: string;
}): BookingRequest {
  const sitterIds = Object.keys(args.initialPrices);
  for (const sid of sitterIds) {
    const p = args.initialPrices[sid];
    if (!Number.isFinite(p) || p <= 0) throw new NegotiationError('INVALID_PRICE');
    if (p < args.floorCents) throw new NegotiationError('BELOW_MINIMUM');
  }
  return {
    id: args.id ?? generateMissionId(),
    ownerId: args.ownerId,
    petIds: args.petIds,
    service: args.service,
    startDate: args.startDate,
    days: args.days,
    country: args.country,
    currency: currencyFor(args.country),
    note: args.note,
    createdAt: args.now,
    status: 'open',
    threads: sitterIds.map((sitterId) => ({
      sitterId,
      status: 'negotiating',
      offers: [makeOffer('owner', args.initialPrices[sitterId], args.now, args.note)],
    })),
  };
}

export const otherParty = (p: OfferParty): OfferParty => (p === 'owner' ? 'sitter' : 'owner');

export function currentOffer(thread: NegotiationThread): Offer | undefined {
  return thread.offers[thread.offers.length - 1];
}

/** Which party must answer now, or undefined if the thread is not negotiating. */
export function turnOf(thread: NegotiationThread): OfferParty | undefined {
  const o = currentOffer(thread);
  if (thread.status !== 'negotiating' || !o || o.status !== 'pending') return undefined;
  return otherParty(o.by);
}

export function offersLeft(thread: NegotiationThread, party: OfferParty): number {
  return Math.max(0, NEGOTIATION.maxOffersPerParty - thread.offers.filter((o) => o.by === party).length);
}

/** Expires pending offers past their deadline; closes the request when no thread is left. */
export function applyExpiry(request: BookingRequest, now: string): BookingRequest {
  if (request.status !== 'open') return request;
  const t = new Date(now).getTime();
  let changed = false;
  const threads = request.threads.map((th) => {
    const o = currentOffer(th);
    if (th.status === 'negotiating' && o && o.status === 'pending' && new Date(o.expiresAt).getTime() <= t) {
      changed = true;
      return {
        ...th,
        status: 'expired' as const,
        offers: th.offers.map((x) => (x.id === o.id ? { ...x, status: 'expired' as const } : x)),
      };
    }
    return th;
  });
  if (!changed) return request;
  return withAutoClose({ ...request, threads });
}

function withAutoClose(request: BookingRequest): BookingRequest {
  if (request.status === 'open' && !request.threads.some((th) => th.status === 'negotiating')) {
    return { ...request, status: 'expired' };
  }
  return request;
}

export type NegotiationAction =
  | { type: 'accept' }
  | { type: 'decline' }
  | { type: 'counter'; priceCents: number; message?: string };

/**
 * One party answers the current offer of a thread.
 * Accepting LOCKS the whole request: every other thread is closed and nobody else can accept.
 */
export function respond(
  input: BookingRequest,
  args: { sitterId: string; party: OfferParty; action: NegotiationAction; floorCents: number; now: string },
): BookingRequest {
  const request = applyExpiry(input, args.now);
  if (request.status === 'locked') throw new NegotiationError('REQUEST_LOCKED');
  if (request.status !== 'open') throw new NegotiationError('REQUEST_CLOSED');
  const thread = request.threads.find((th) => th.sitterId === args.sitterId);
  if (!thread) throw new NegotiationError('UNKNOWN_SITTER');
  if (thread.status !== 'negotiating') throw new NegotiationError('THREAD_CLOSED');
  if (turnOf(thread) !== args.party) throw new NegotiationError('NOT_YOUR_TURN');
  const offer = currentOffer(thread)!;

  const replaceThread = (next: NegotiationThread) =>
    request.threads.map((th) => (th.sitterId === args.sitterId ? next : th));

  switch (args.action.type) {
    case 'accept': {
      const agreed: NegotiationThread = {
        ...thread,
        status: 'agreed',
        offers: thread.offers.map((x) => (x.id === offer.id ? { ...x, status: 'accepted' } : x)),
      };
      return {
        ...request,
        status: 'locked',
        lockedSitterId: args.sitterId,
        lockedOfferId: offer.id,
        lockedAt: args.now,
        threads: request.threads.map((th) => {
          if (th.sitterId === args.sitterId) return agreed;
          if (th.status !== 'negotiating') return th;
          return {
            ...th,
            status: 'closed',
            offers: th.offers.map((x) => (x.status === 'pending' ? { ...x, status: 'superseded' } : x)),
          };
        }),
      };
    }
    case 'decline': {
      return withAutoClose({
        ...request,
        threads: replaceThread({
          ...thread,
          status: 'declined',
          offers: thread.offers.map((x) => (x.id === offer.id ? { ...x, status: 'declined' } : x)),
        }),
      });
    }
    case 'counter': {
      const price = args.action.priceCents;
      if (!Number.isFinite(price) || price <= 0) throw new NegotiationError('INVALID_PRICE');
      if (price < args.floorCents) throw new NegotiationError('BELOW_MINIMUM');
      if (offersLeft(thread, args.party) <= 0) throw new NegotiationError('MAX_ROUNDS');
      return {
        ...request,
        threads: replaceThread({
          ...thread,
          offers: [
            ...thread.offers.map((x) => (x.id === offer.id ? { ...x, status: 'countered' as const } : x)),
            makeOffer(args.party, price, args.now, args.action.message),
          ],
        }),
      };
    }
  }
}

/** Owner withdraws the whole request (before it is locked). */
export function cancelRequest(request: BookingRequest): BookingRequest {
  if (request.status !== 'open') throw new NegotiationError('REQUEST_CLOSED');
  return {
    ...request,
    status: 'cancelled',
    threads: request.threads.map((th) =>
      th.status === 'negotiating'
        ? { ...th, status: 'closed', offers: th.offers.map((x) => (x.status === 'pending' ? { ...x, status: 'superseded' } : x)) }
        : th,
    ),
  };
}

export function agreedOffer(request: BookingRequest): Offer | undefined {
  if (request.status !== 'locked') return undefined;
  return request.threads.find((t) => t.sitterId === request.lockedSitterId)?.offers.find((o) => o.id === request.lockedOfferId);
}
