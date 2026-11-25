/** Mission chat model (local in phase 1/2 demo; mirrors public.messages / mission_events on Supabase). */
export type ChatParty = 'owner' | 'sitter';

export type ChatFile = { name: string; mime: string; uri: string; size?: number; width?: number; height?: number };

export type ChatMessage = {
  id: string;
  from: ChatParty | 'system';
  kind: 'text' | 'file' | 'event' | 'firstNight';
  body?: string;
  file?: ChatFile;
  createdAt: string;
};

export type NightAnswer = 'calm' | 'woke' | 'restless';
export type MorningAnswer = 'relaxed' | 'playful' | 'stressed' | 'tired';

export type FirstNightUpdate = {
  status: 'pending' | 'answered';
  night?: NightAnswer;
  morning?: MorningAnswer;
  comment?: string;
  photo?: ChatFile;
  answeredAt?: string;
  rewardPoints: number;
};

export type MissionChat = {
  requestId: string;
  status: 'confirmed' | 'in_progress';
  dropoffCode: string;
  dropoffAttempts: number;
  startedAt?: string;
  confirmedAt: string;
  messages: ChatMessage[];
  firstNight: FirstNightUpdate;
};

export const NIGHT_LABELS: Record<NightAnswer, string> = {
  calm: 'Tranquillement',
  woke: 'Il s’est réveillé plusieurs fois',
  restless: 'Nuit agitée',
};

export const MORNING_LABELS: Record<MorningAnswer, string> = {
  relaxed: 'Calme et détendu',
  playful: 'Actif et joueur',
  stressed: 'Un peu stressé',
  tired: 'Plus fatigué que d’habitude',
};
