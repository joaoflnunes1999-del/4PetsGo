import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  BookingRequest,
  OfferParty,
  OwnerProfile,
  PetPhoto,
  PetProfile,
  Role,
  ServiceType,
  SitterProfile,
} from '@/domain/types';
import {
  applyExpiry,
  cancelRequest,
  createRequest,
  NEGOTIATION_ERROR_MESSAGES,
  NegotiationError,
  respond,
  type NegotiationAction,
} from '@/features/booking/negotiation';
import { getCity } from '@/features/sitters/cities';
import { DEMO_SITTERS } from '@/features/sitters/demoSitters';

import { newId } from './ids';
import { deletePhotoFile, persistPhoto } from './photoStorage';

export type Result = { ok: true } | { ok: false; error: string };

type State = {
  role?: Role;
  owner?: OwnerProfile;
  /** The user's own sitter profile when role = sitter. */
  mySitter?: SitterProfile;
  pets: PetProfile[];
  photos: PetPhoto[];
  requests: BookingRequest[];
};

type Actions = {
  completeOwnerOnboarding: (input: { firstName: string; cityId: string }) => void;
  completeSitterOnboarding: (profile: SitterProfile) => void;
  updateMySitter: (patch: Partial<SitterProfile>) => void;
  /** Phase 1 demo only (dev builds): Owner Club purchase arrives with Superwall in phase 3. */
  setOwnerClubDemo: (value: boolean) => void;
  addPet: (pet: Omit<PetProfile, 'id' | 'ownerId' | 'createdAt'>) => string;
  updatePet: (id: string, patch: Partial<PetProfile>) => void;
  deletePet: (id: string) => void;
  addPhotos: (petId: string, assets: { uri: string; width?: number; height?: number }[]) => Promise<string[]>;
  updatePhoto: (id: string, patch: Pick<PetPhoto, 'caption'>) => void;
  deletePhoto: (id: string) => void;
  setMainPhoto: (petId: string, photoId: string | undefined) => void;
  sendRequest: (input: {
    petIds: string[];
    service: ServiceType;
    startDate: string;
    days: number;
    initialPrices: Record<string, number>;
    floorCents: number;
    note?: string;
  }) => { ok: true; id: string } | { ok: false; error: string };
  respondToOffer: (args: {
    requestId: string;
    sitterId: string;
    party: OfferParty;
    action: NegotiationAction;
    floorCents: number;
  }) => Result;
  cancel: (requestId: string) => Result;
  refreshExpiry: () => void;
  resetAll: () => void;
};

const initial: State = { pets: [], photos: [], requests: [] };

const toMessage = (e: unknown) =>
  e instanceof NegotiationError ? NEGOTIATION_ERROR_MESSAGES[e.code] : 'Une erreur inattendue est survenue.';

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOwnerOnboarding: ({ firstName, cityId }) =>
        set({ role: 'owner', owner: { id: newId('owner'), firstName: firstName.trim(), cityId, ownerClub: false } }),

      completeSitterOnboarding: (profile) => set({ role: 'sitter', mySitter: profile }),

      updateMySitter: (patch) => set((s) => (s.mySitter ? { mySitter: { ...s.mySitter, ...patch } } : s)),

      setOwnerClubDemo: (value) => set((s) => (s.owner ? { owner: { ...s.owner, ownerClub: value } } : s)),

      addPet: (pet) => {
        const id = newId('pet');
        const ownerId = get().owner?.id ?? 'local-owner';
        set((s) => ({ pets: [...s.pets, { ...pet, id, ownerId, createdAt: new Date().toISOString() }] }));
        return id;
      },

      updatePet: (id, patch) => set((s) => ({ pets: s.pets.map((p) => (p.id === id ? { ...p, ...patch, id } : p)) })),

      deletePet: (id) => {
        const toRemove = get().photos.filter((ph) => ph.petId === id);
        toRemove.forEach((ph) => deletePhotoFile(ph.uri));
        set((s) => ({ pets: s.pets.filter((p) => p.id !== id), photos: s.photos.filter((ph) => ph.petId !== id) }));
      },

      addPhotos: async (petId, assets) => {
        const created: PetPhoto[] = [];
        for (const a of assets) {
          const id = newId('ph');
          const uri = await persistPhoto(a.uri, id);
          created.push({ id, petId, uri, width: a.width, height: a.height, createdAt: new Date().toISOString() });
        }
        set((s) => ({ photos: [...s.photos, ...created] }));
        return created.map((c) => c.id);
      },

      updatePhoto: (id, patch) => set((s) => ({ photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      deletePhoto: (id) => {
        const ph = get().photos.find((p) => p.id === id);
        if (ph) deletePhotoFile(ph.uri);
        set((s) => ({
          photos: s.photos.filter((p) => p.id !== id),
          pets: s.pets.map((p) => (p.mainPhotoId === id ? { ...p, mainPhotoId: undefined } : p)),
        }));
      },

      setMainPhoto: (petId, photoId) =>
        set((s) => ({ pets: s.pets.map((p) => (p.id === petId ? { ...p, mainPhotoId: photoId } : p)) })),

      sendRequest: (input) => {
        const owner = get().owner;
        if (!owner) return { ok: false, error: 'Profil propriétaire introuvable.' };
        try {
          const req = createRequest({
            ...input,
            ownerId: owner.id,
            country: getCity(owner.cityId).country,
            now: new Date().toISOString(),
          });
          set((s) => ({ requests: [req, ...s.requests] }));
          return { ok: true, id: req.id };
        } catch (e) {
          return { ok: false, error: toMessage(e) };
        }
      },

      respondToOffer: ({ requestId, sitterId, party, action, floorCents }) => {
        // Single synchronous read-modify-write: the lock check and the write happen atomically
        // on the client. Phase 2 moves this to a transactional Postgres function.
        let result: Result = { ok: true };
        set((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          if (!req) {
            result = { ok: false, error: 'Demande introuvable.' };
            return s;
          }
          try {
            const next = respond(req, { sitterId, party, action, floorCents, now: new Date().toISOString() });
            return { requests: s.requests.map((r) => (r.id === requestId ? next : r)) };
          } catch (e) {
            result = { ok: false, error: toMessage(e) };
            // Persist expiry side effects even when the action is refused.
            const refreshed = applyExpiry(req, new Date().toISOString());
            return refreshed === req ? s : { requests: s.requests.map((r) => (r.id === requestId ? refreshed : r)) };
          }
        });
        return result;
      },

      cancel: (requestId) => {
        let result: Result = { ok: true };
        set((s) => {
          const req = s.requests.find((r) => r.id === requestId);
          if (!req) return s;
          try {
            return { requests: s.requests.map((r) => (r.id === requestId ? cancelRequest(req) : r)) };
          } catch (e) {
            result = { ok: false, error: toMessage(e) };
            return s;
          }
        });
        return result;
      },

      refreshExpiry: () => {
        const now = new Date().toISOString();
        set((s) => {
          const next = s.requests.map((r) => applyExpiry(r, now));
          return next.some((r, i) => r !== s.requests[i]) ? { requests: next } : s;
        });
      },

      resetAll: () => {
        get().photos.forEach((ph) => deletePhotoFile(ph.uri));
        set({ ...initial, role: undefined, owner: undefined, mySitter: undefined });
      },
    }),
    {
      name: '4petsgo-local-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** All sitters visible in search: demo sitters + the user's own sitter profile. */
export function allSitters(mySitter?: SitterProfile): SitterProfile[] {
  return mySitter ? [...DEMO_SITTERS, mySitter] : DEMO_SITTERS;
}

export function findSitter(id: string, mySitter?: SitterProfile): SitterProfile | undefined {
  return allSitters(mySitter).find((s) => s.id === id);
}

/** True once persisted state has been rehydrated (avoids flashing the onboarding). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAppStore.persist.onFinishHydration(cb),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
