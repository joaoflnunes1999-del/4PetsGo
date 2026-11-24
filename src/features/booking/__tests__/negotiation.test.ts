import type { BookingRequest } from '@/domain/types';

import {
  applyExpiry,
  cancelRequest,
  createRequest,
  generateMissionId,
  NegotiationError,
  offersLeft,
  respond,
  turnOf,
} from '../negotiation';

const T0 = '2026-11-24T10:00:00.000Z';
const at = (h: number) => new Date(new Date(T0).getTime() + h * 3600_000).toISOString();
const FLOOR = 3000;

function make(): BookingRequest {
  return createRequest({
    id: '4PG-TEST01',
    ownerId: 'owner',
    petIds: ['pet1'],
    service: 'boarding',
    startDate: '2026-12-01',
    days: 3,
    country: 'FR',
    initialPrices: { a: 4500, b: 4000, c: 3600 },
    floorCents: FLOOR,
    now: T0,
  });
}

const expectCode = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(NegotiationError);
    expect((e as NegotiationError).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
};

describe('createRequest', () => {
  it('opens one thread per sitter with a pending owner offer that expires in 48 h', () => {
    const r = make();
    expect(r.status).toBe('open');
    expect(r.currency).toBe('EUR');
    expect(r.threads).toHaveLength(3);
    const o = r.threads[0].offers[0];
    expect(o.by).toBe('owner');
    expect(o.status).toBe('pending');
    expect(o.expiresAt).toBe(at(48));
    expect(turnOf(r.threads[0])).toBe('sitter');
  });

  it('refuses an initial price below the floor', () => {
    expectCode(
      () =>
        createRequest({
          ownerId: 'o',
          petIds: [],
          service: 'boarding',
          startDate: '2026-12-01',
          days: 1,
          country: 'FR',
          initialPrices: { a: 100 },
          floorCents: FLOOR,
          now: T0,
        }),
      'BELOW_MINIMUM',
    );
  });

  it('generates 4PG- mission ids', () => {
    expect(generateMissionId()).toMatch(/^4PG-[A-Z2-9]{6}$/);
  });
});

describe('respond', () => {
  it('alternates turns and enforces the floor', () => {
    let r = make();
    expectCode(() => respond(r, { sitterId: 'a', party: 'owner', action: { type: 'accept' }, floorCents: FLOOR, now: at(1) }), 'NOT_YOUR_TURN');
    expectCode(
      () => respond(r, { sitterId: 'a', party: 'sitter', action: { type: 'counter', priceCents: 2000 }, floorCents: FLOOR, now: at(1) }),
      'BELOW_MINIMUM',
    );
    r = respond(r, { sitterId: 'a', party: 'sitter', action: { type: 'counter', priceCents: 5000 }, floorCents: FLOOR, now: at(1) });
    const th = r.threads.find((t) => t.sitterId === 'a')!;
    expect(th.offers.map((o) => o.status)).toEqual(['countered', 'pending']);
    expect(turnOf(th)).toBe('owner');
  });

  it('limits each party to 3 offers (3 allers-retours)', () => {
    let r = make();
    const step = (party: 'owner' | 'sitter', price: number, h: number) =>
      (r = respond(r, { sitterId: 'a', party, action: { type: 'counter', priceCents: price }, floorCents: FLOOR, now: at(h) }));
    step('sitter', 5000, 1); // sitter 1
    step('owner', 4600, 2); // owner 2
    step('sitter', 4900, 3); // sitter 2
    step('owner', 4700, 4); // owner 3
    step('sitter', 4800, 5); // sitter 3
    const th = r.threads.find((t) => t.sitterId === 'a')!;
    expect(offersLeft(th, 'owner')).toBe(0);
    expect(offersLeft(th, 'sitter')).toBe(0);
    expectCode(() => step('owner', 4750, 6), 'MAX_ROUNDS');
    // Owner can still accept or decline the last offer.
    r = respond(r, { sitterId: 'a', party: 'owner', action: { type: 'accept' }, floorCents: FLOOR, now: at(6) });
    expect(r.status).toBe('locked');
  });

  it('locks the mission on first acceptance: no other sitter can accept', () => {
    let r = make();
    r = respond(r, { sitterId: 'b', party: 'sitter', action: { type: 'accept' }, floorCents: FLOOR, now: at(2) });
    expect(r.status).toBe('locked');
    expect(r.lockedSitterId).toBe('b');
    expect(r.threads.find((t) => t.sitterId === 'b')!.status).toBe('agreed');
    expect(r.threads.filter((t) => t.sitterId !== 'b').every((t) => t.status === 'closed')).toBe(true);
    expect(r.threads.find((t) => t.sitterId === 'a')!.offers[0].status).toBe('superseded');
    // Simultaneous acceptance by another sitter on the same (stale or fresh) state is rejected.
    expectCode(() => respond(r, { sitterId: 'a', party: 'sitter', action: { type: 'accept' }, floorCents: FLOOR, now: at(2) }), 'REQUEST_LOCKED');
    expectCode(() => respond(r, { sitterId: 'c', party: 'sitter', action: { type: 'counter', priceCents: 4000 }, floorCents: FLOOR, now: at(2) }), 'REQUEST_LOCKED');
  });

  it('expires pending offers after 48 h and closes the request when nothing is left', () => {
    let r = make();
    r = respond(r, { sitterId: 'a', party: 'sitter', action: { type: 'decline' }, floorCents: FLOOR, now: at(1) });
    r = respond(r, { sitterId: 'b', party: 'sitter', action: { type: 'counter', priceCents: 4200 }, floorCents: FLOOR, now: at(10) });
    r = applyExpiry(r, at(48));
    expect(r.threads.find((t) => t.sitterId === 'c')!.status).toBe('expired');
    expect(r.threads.find((t) => t.sitterId === 'b')!.status).toBe('negotiating'); // owner has until h58
    expect(r.status).toBe('open');
    r = applyExpiry(r, at(58));
    expect(r.status).toBe('expired');
    expectCode(() => respond(r, { sitterId: 'b', party: 'owner', action: { type: 'accept' }, floorCents: FLOOR, now: at(59) }), 'REQUEST_CLOSED');
  });

  it('lets the owner cancel an open request', () => {
    const r = cancelRequest(make());
    expect(r.status).toBe('cancelled');
    expect(r.threads.every((t) => t.status === 'closed')).toBe(true);
  });
});
