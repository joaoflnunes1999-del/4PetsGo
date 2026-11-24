import { create } from 'zustand';

import type { ServiceType } from '@/domain/types';
import { nextDays } from '@/lib/dates';

type SearchState = {
  service: ServiceType;
  petIds: string[];
  startDate: string;
  days: number;
  selectedSitterIds: string[];
  set: (patch: Partial<Omit<SearchState, 'set' | 'toggleSitter' | 'clearSelection'>>) => void;
  toggleSitter: (id: string) => void;
  clearSelection: () => void;
};

/** Ephemeral search criteria + multi-sitter selection shared by Search, Sitter profile and New request. */
export const useSearchStore = create<SearchState>()((set) => ({
  service: 'boarding',
  petIds: [],
  startDate: nextDays(2)[1],
  days: 3,
  selectedSitterIds: [],
  set: (patch) =>
    set((s) => {
      // Changing the criteria invalidates the selection (prices and availability change).
      const changed =
        (patch.service !== undefined && patch.service !== s.service) ||
        (patch.petIds !== undefined && patch.petIds.join() !== s.petIds.join()) ||
        (patch.startDate !== undefined && patch.startDate !== s.startDate) ||
        (patch.days !== undefined && patch.days !== s.days);
      return { ...patch, selectedSitterIds: changed ? [] : (patch.selectedSitterIds ?? s.selectedSitterIds) };
    }),
  toggleSitter: (id) =>
    set((s) => ({
      selectedSitterIds: s.selectedSitterIds.includes(id)
        ? s.selectedSitterIds.filter((x) => x !== id)
        : [...s.selectedSitterIds, id],
    })),
  clearSelection: () => set({ selectedSitterIds: [] }),
}));
