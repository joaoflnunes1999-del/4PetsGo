/**
 * Cancellation before the drop-off (founder rules, 25/11/2026). Mirrors private.cancellation_refund_rate (SQL).
 *  > 14 days before the start: 100 % refunded · 3–14 days: 75 % · 24–72 h: 50 % · < 24 h: 0 %.
 *  Cancelled by the sitter → always 100 %. The sitter may waive the cancellation fee (compassion) → 100 %.
 */
export function cancellationRefundRate(hoursBeforeStart: number): number {
  if (hoursBeforeStart > 14 * 24) return 1;
  if (hoursBeforeStart >= 72) return 0.75;
  if (hoursBeforeStart >= 24) return 0.5;
  return 0;
}

export function cancellationSettlement(args: {
  priceCents: number;
  ownerFeeCents: number;
  hoursBeforeStart: number;
  cancelledBy: 'owner' | 'sitter';
  commissionRate: number;
  feeWaived?: boolean;
}) {
  const rate = args.cancelledBy === 'sitter' || args.feeWaived ? 1 : cancellationRefundRate(args.hoursBeforeStart);
  const serviceRefund = Math.round(args.priceCents * rate);
  const ownerFeeRefund = Math.round(args.ownerFeeCents * rate); // ⚠️ à valider: fee follows the same rate
  const retained = args.priceCents - serviceRefund;
  return {
    rate,
    serviceRefundCents: serviceRefund,
    ownerFeeRefundCents: ownerFeeRefund,
    cancellationFeeCents: retained,
    sitterEarnedCents: retained - Math.round(retained * args.commissionRate),
  };
}
