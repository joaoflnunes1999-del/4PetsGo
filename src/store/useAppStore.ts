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
import { PICKUP_REASON_LABELS, type ChatFile, type ChatMessage, type ChatParty, type FirstNightUpdate, type MissionChat, type PickupReason } from '@/features/chat/types';
import { firstNightReward } from '@/features/levels/levels';
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
  /** Mission chats keyed by request id (local demo until Supabase is connected). */
  chats: Record<string, MissionChat>;
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
  /** Phase 2 stand-in for payment (founder-approved): opens the chat and creates the drop-off code. */
  confirmMission: (requestId: string) => Result;
  sendChatMessage: (requestId: string, from: ChatParty, body: string) => void;
  sendChatFile: (requestId: string, from: ChatParty, file: ChatFile) => void;
  answerFirstNight: (requestId: string, answer: Pick<FirstNightUpdate, 'night' | 'morning' | 'comment' | 'photo'>) => Result;
  /** Sitter generates the pick-up code (always available while in progress). Early end needs a reason. */
  generatePickupCode: (requestId: string, reason?: PickupReason) => { ok: true; code: string } | { ok: false; error: string };
  /** Owner types the pick-up code → mission completed. */
  enterPickupCode: (requestId: string, code: string) => 'completed' | 'invalid';
  /** Sitter types the drop-off code at hand-over → mission starts; the First Night Update appears only then. */
  enterDropoffCode: (requestId: string, code: string) => 'started' | 'invalid' | 'locked_out';
  resetAll: () => void;
};

const initial: State = { pets: [], photos: [], requests: [], chats: {} };

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

      confirmMission: (requestId) => {
        const req = get().requests.find((r) => r.id === requestId);
        if (!req || req.status !== 'locked') return { ok: false, error: 'La mission n’est pas encore verrouillée.' };
        if (get().chats[requestId]) return { ok: true };
        const now = new Date().toISOString();
        const chat: MissionChat = {
          requestId,
          status: 'confirmed',
          dropoffCode: String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0'),
          dropoffAttempts: 0,
          confirmedAt: now,
          messages: [
            { id: newId('msg'), from: 'system', kind: 'event', body: 'Mission confirmée · le chat est ouvert', createdAt: now },
          ],
          firstNight: { status: 'pending', rewardPoints: firstNightReward({ answers: 2 }) },
        };
        set((s) => ({ chats: { ...s.chats, [requestId]: chat } }));
        return { ok: true };
      },

      enterDropoffCode: (requestId, code) => {
        const chat = get().chats[requestId];
        if (!chat || chat.status !== 'confirmed') return 'invalid';
        if (chat.dropoffAttempts >= 5) return 'locked_out';
        if (code.replace(/\s/g, '') !== chat.dropoffCode) {
          set((s) => ({ chats: { ...s.chats, [requestId]: { ...chat, dropoffAttempts: chat.dropoffAttempts + 1 } } }));
          return chat.dropoffAttempts + 1 >= 5 ? 'locked_out' : 'invalid';
        }
        const now = new Date().toISOString();
        const pets = get().pets.filter((p) => get().requests.find((r) => r.id === requestId)?.petIds.includes(p.id));
        const petName = pets.map((p) => p.name).join(' & ') || 'L’animal';
        set((s) => ({
          chats: {
            ...s.chats,
            [requestId]: {
              ...chat,
              status: 'in_progress',
              startedAt: now,
              messages: [
                ...chat.messages,
                { id: newId('msg'), from: 'system', kind: 'event', body: `${petName} a été remis au Pet Sitter · mission commencée`, createdAt: now },
                // The First Night Update only exists once the pet has been handed over.
                { id: newId('msg'), from: 'system', kind: 'firstNight', createdAt: now },
              ],
            },
          },
        }));
        return 'started';
      },

      generatePickupCode: (requestId, reason) => {
        const chat = get().chats[requestId];
        const req = get().requests.find((r) => r.id === requestId);
        if (!chat || !req || chat.status !== 'in_progress') return { ok: false, error: 'La mission n’a pas commencé.' };
        const end = new Date(`${req.startDate}T12:00:00`);
        end.setDate(end.getDate() + (req.service === 'dogWalking' ? 0 : req.days - 1));
        const lastDay = new Date().setHours(23, 59, 59, 999) >= end.getTime();
        const finalReason: PickupReason = lastDay ? 'completed' : (reason ?? 'completed');
        if (!lastDay && finalReason === 'completed') return { ok: false, error: 'Indiquez pourquoi la mission se termine plus tôt.' };
        const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
        const now = new Date().toISOString();
        set((s) => ({
          chats: {
            ...s.chats,
            [requestId]: {
              ...chat,
              pickupCode: code,
              pickupReason: finalReason,
              messages: [
                ...chat.messages,
                // The reason is visible to both; the code itself never appears in a message.
                { id: newId('msg'), from: 'system', kind: 'event', body: `Code de fin de mission généré · ${PICKUP_REASON_LABELS[finalReason]}`, createdAt: now },
              ],
            },
          },
        }));
        return { ok: true, code };
      },

      enterPickupCode: (requestId, code) => {
        const chat = get().chats[requestId];
        if (!chat || chat.status !== 'in_progress' || !chat.pickupCode) return 'invalid';
        if (code.replace(/\s/g, '') !== chat.pickupCode) return 'invalid';
        const now = new Date().toISOString();
        set((s) => ({
          chats: {
            ...s.chats,
            [requestId]: {
              ...chat,
              status: 'completed',
              endedAt: now,
              pickupCode: undefined,
              messages: [...chat.messages, { id: newId('msg'), from: 'system', kind: 'event', body: 'Animal récupéré · mission terminée', createdAt: now }],
            },
          },
        }));
        return 'completed';
      },

      // Messages are append-only: there is deliberately no edit/delete action (founder rule).
      sendChatMessage: (requestId, from, body) => {
        const text = body.trim();
        if (!text) return;
        set((s) => {
          const chat = s.chats[requestId];
          if (!chat) return s;
          const msg: ChatMessage = { id: newId('msg'), from, kind: 'text', body: text, createdAt: new Date().toISOString() };
          return { chats: { ...s.chats, [requestId]: { ...chat, messages: [...chat.messages, msg] } } };
        });
      },

      sendChatFile: (requestId, from, file) =>
        set((s) => {
          const chat = s.chats[requestId];
          if (!chat) return s;
          const msg: ChatMessage = { id: newId('msg'), from, kind: 'file', file, createdAt: new Date().toISOString() };
          return { chats: { ...s.chats, [requestId]: { ...chat, messages: [...chat.messages, msg] } } };
        }),

      answerFirstNight: (requestId, answer) => {
        const chat = get().chats[requestId];
        if (!chat) return { ok: false, error: 'Chat introuvable.' };
        if (chat.status !== 'in_progress') return { ok: false, error: 'Le First Night Update arrive après la remise de l’animal.' };
        if (chat.firstNight.status === 'answered') return { ok: false, error: 'Le First Night Update a déjà été envoyé.' };
        if (!answer.night || !answer.morning) return { ok: false, error: 'Répondez aux deux questions.' };
        const now = new Date().toISOString();
        set((s) => ({
          chats: {
            ...s.chats,
            [requestId]: {
              ...chat,
              firstNight: {
                ...chat.firstNight,
                ...answer,
                comment: answer.comment?.trim() || undefined,
                status: 'answered',
                answeredAt: now,
                rewardPoints: firstNightReward({ answers: 2, comment: answer.comment }),
              },
            },
          },
        }));
        return { ok: true };
      },

      resetAll: () => {
        get().photos.forEach((ph) => deletePhotoFile(ph.uri));
        set({ ...initial, chats: {}, role: undefined, owner: undefined, mySitter: undefined });
      },
    }),
    {
      name: '4petsgo-local-v1',
      version: 2,
      // v2 adds mission chats.
      migrate: (persisted) => ({ chats: {}, ...(persisted as object) }) as State & Actions,
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
