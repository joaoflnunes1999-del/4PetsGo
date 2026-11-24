/** Core domain model. Mirrors the future Supabase schema (phase 2). */

export type Country = 'FR' | 'CH';
export type Currency = 'EUR' | 'CHF';
export type Species = 'dog' | 'cat';
export type Sex = 'male' | 'female';
export type Role = 'owner' | 'sitter';

/** Size category used by the minimum-price grid. */
export type SizeCategory = 'cat' | 'dogSmall' | 'dogMedium' | 'dogLarge' | 'dogXL';

export type ServiceType = 'boarding' | 'homeVisits' | 'dogWalking';

export type PhotoVisibility = 'public' | 'confirmedBookings' | 'private';

export type LevelId = 'beginner' | 'explorer' | 'advanced' | 'expert' | 'master';

export type GeoPoint = { lat: number; lng: number };

export type City = { id: string; name: string; region: string; country: Country } & GeoPoint;

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  route: string; // oral, cutané…
  frequency: string;
  schedule: string; // horaires
};

export type PetProfile = {
  id: string; // Pet ID
  ownerId: string;
  name: string;
  species: Species;
  breedId: string;
  birthDate?: string; // ISO yyyy-mm-dd
  estimatedAgeYears?: number;
  sex?: Sex;
  weightKg?: number;
  bio?: string;
  /** Photo id from the gallery; undefined = breed library image. */
  mainPhotoId?: string;
  photoVisibility: PhotoVisibility;
  personality: {
    traits: string[];
    energy?: 'low' | 'medium' | 'high';
    withAnimals?: string;
    withChildren?: string;
    socialization?: string;
    fears?: string;
    commands?: string;
    notes?: string;
  };
  routine: {
    feeding?: string;
    activities?: string;
    walks?: string;
    sleep?: string;
    toys?: string;
    other?: string;
  };
  care: {
    vetName?: string;
    vetPhone?: string;
    vetAddress?: string;
    microchip?: string;
    medications: Medication[];
  };
  createdAt: string;
};

export type PetPhoto = {
  id: string;
  petId: string;
  uri: string;
  width?: number;
  height?: number;
  caption?: string;
  createdAt: string;
};

export type HomeDetails = {
  housing: 'apartment' | 'house';
  surfaceM2: number;
  balcony: boolean;
  garden: 'none' | 'fenced' | 'partlyFenced' | 'open';
  children: boolean;
  residentAnimals?: string;
  canSeparate: boolean;
  sleepingSpot?: string;
};

export type SitterService = {
  type: ServiceType;
  /** Boarding & home visits: daily rate per size category (cents), always ≥ minimum. */
  dailyRates?: Partial<Record<SizeCategory, number>>;
  /** Dog walking: price per walk (cents), freely negotiated. */
  walkPrice?: number;
  walkDurationsMin?: number[];
  maxDogs?: number;
};

export type SitterProfile = {
  id: string;
  firstName: string;
  /** Age in years (shown on the public profile). */
  age: number;
  photoUri?: string;
  avatarSeed: number; // used for the generated avatar when no photo
  cityId: string;
  location: GeoPoint;
  radiusKm: number;
  bio: string;
  experienceYears: number;
  acceptedSpecies: Species[];
  acceptedSizes: SizeCategory[];
  services: SitterService[];
  home?: HomeDetails;
  certifications: { name: string; country: Country; status: 'pending' | 'verified' | 'expired' }[];
  pawPoints: number;
  completedMissions: number;
  rating?: number; // 0–5
  reviewCount: number;
  identityVerified: boolean;
  /** ISO dates the sitter is NOT available. */
  unavailableDates: string[];
  joinedAt: string;
};

export type OwnerProfile = {
  id: string;
  firstName: string;
  cityId: string;
  ownerClub: boolean;
};

export type OfferParty = 'owner' | 'sitter';

export type OfferStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'expired' | 'superseded';

export type Offer = {
  id: string;
  by: OfferParty;
  priceCents: number;
  message?: string;
  createdAt: string;
  expiresAt: string;
  status: OfferStatus;
};

export type ThreadStatus = 'negotiating' | 'agreed' | 'declined' | 'expired' | 'closed';

export type NegotiationThread = {
  sitterId: string;
  status: ThreadStatus;
  offers: Offer[];
};

export type RequestStatus = 'open' | 'locked' | 'expired' | 'cancelled';

export type BookingRequest = {
  /** Unique mission identifier, e.g. 4PG-7K2Q9X. */
  id: string;
  ownerId: string;
  petIds: string[];
  service: ServiceType;
  startDate: string; // ISO date
  days: number;
  country: Country;
  currency: Currency;
  /** Dog walking only: round-trip distance used for the km fee. Stored per thread because it depends on the sitter. */
  note?: string;
  createdAt: string;
  status: RequestStatus;
  lockedSitterId?: string;
  lockedOfferId?: string;
  lockedAt?: string;
  threads: NegotiationThread[];
};
