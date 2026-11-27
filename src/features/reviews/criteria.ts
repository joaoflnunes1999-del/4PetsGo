import type { ChatParty } from '@/features/chat/types';

/** Review criteria validated by the founder (27/11/2026) — mirrors public.submit_review. */
export const REVIEW_CRITERIA: Record<ChatParty, { key: string; label: string }[]> = {
  owner: [
    { key: 'care', label: 'Qualité des soins' },
    { key: 'communication', label: 'Communication' },
    { key: 'punctuality', label: 'Ponctualité' },
    { key: 'overall', label: 'Expérience générale' },
  ],
  sitter: [
    { key: 'punctuality', label: 'Ponctualité' },
    { key: 'communication', label: 'Communication' },
    { key: 'agreements', label: 'Respect des accords' },
    { key: 'handover', label: 'Organisation de la remise et de la récupération' },
  ],
};

export function reviewRating(criteria: Record<string, number>, role: ChatParty): number | undefined {
  const keys = REVIEW_CRITERIA[role].map((c) => c.key);
  if (!keys.every((k) => Number.isInteger(criteria[k]) && criteria[k] >= 1 && criteria[k] <= 5)) return undefined;
  return Math.round((keys.reduce((s, k) => s + criteria[k], 0) / keys.length) * 10) / 10;
}

export const REVIEW_PUBLISH_DAYS = 14;
