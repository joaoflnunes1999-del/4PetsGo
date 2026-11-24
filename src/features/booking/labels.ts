import type { RequestStatus } from '@/domain/types';

export const REQUEST_BADGE: Record<RequestStatus, { label: string; tone: 'primary' | 'success' | 'warning' | 'muted' }> = {
  open: { label: 'EN COURS', tone: 'primary' },
  locked: { label: 'MISSION VERROUILLÉE', tone: 'success' },
  expired: { label: 'EXPIRÉE', tone: 'warning' },
  cancelled: { label: 'ANNULÉE', tone: 'muted' },
};
