import { cancellationRefundRate, cancellationSettlement } from '../cancellation';

describe('cancellation policy', () => {
  it('applies the validated brackets', () => {
    expect(cancellationRefundRate(15 * 24)).toBe(1);
    expect(cancellationRefundRate(14 * 24)).toBe(0.75);
    expect(cancellationRefundRate(72)).toBe(0.75);
    expect(cancellationRefundRate(71)).toBe(0.5);
    expect(cancellationRefundRate(24)).toBe(0.5);
    expect(cancellationRefundRate(23)).toBe(0);
  });

  it('retains the fee for the sitter (minus commission) when the owner cancels late', () => {
    const s = cancellationSettlement({ priceCents: 8000, ownerFeeCents: 400, hoursBeforeStart: 100, cancelledBy: 'owner', commissionRate: 0.05 });
    expect(s.serviceRefundCents).toBe(6000);
    expect(s.cancellationFeeCents).toBe(2000);
    expect(s.sitterEarnedCents).toBe(1900);
  });

  it('refunds everything when the sitter cancels or waives the fee', () => {
    expect(cancellationSettlement({ priceCents: 8000, ownerFeeCents: 400, hoursBeforeStart: 2, cancelledBy: 'sitter', commissionRate: 0.05 }).rate).toBe(1);
    const waived = cancellationSettlement({ priceCents: 8000, ownerFeeCents: 400, hoursBeforeStart: 2, cancelledBy: 'owner', commissionRate: 0.05, feeWaived: true });
    expect(waived.serviceRefundCents).toBe(8000);
    expect(waived.ownerFeeRefundCents).toBe(400);
    expect(waived.sitterEarnedCents).toBe(0);
  });
});
