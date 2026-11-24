import type { LevelId } from '@/domain/types';

/** Level emblem = numbered paw image (see components/levels/LevelIcon). */
export type Level = {
  id: LevelId;
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
  minPoints: number;
};

/** ⚠️ Seuils indicatifs (PRD §3.10) — configurable. */
export const LEVELS: readonly Level[] = [
  { id: 'beginner', rank: 1, name: 'Beginner', minPoints: 0 },
  { id: 'explorer', rank: 2, name: 'Explorer', minPoints: 200 },
  { id: 'advanced', rank: 3, name: 'Advanced', minPoints: 600 },
  { id: 'expert', rank: 4, name: 'Expert', minPoints: 1500 },
  { id: 'master', rank: 5, name: 'Master', minPoints: 3000 },
];

export function levelFor(points: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) if (points >= l.minPoints) current = l;
  return current;
}

export function levelProgress(points: number): { level: Level; next?: Level; progress: number; remaining: number } {
  const level = levelFor(points);
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  if (!next) return { level, progress: 1, remaining: 0 };
  const span = next.minPoints - level.minPoints;
  return { level, next, progress: (points - level.minPoints) / span, remaining: next.minPoints - points };
}

/** ⚠️ Valeurs indicatives (PRD §3.10). */
export const PAW_REWARDS = { missionCompleted: 30, firstMissionBonus: 20, profileComplete: 20, scheduledPhoto: 2, firstNightUpdate: 5 } as const;
export const OWNER_CLUB_PAW_MULTIPLIER = 1.5;

/** Paw Points a sitter would earn for completing a mission (shown before acceptance). */
export function missionPawPoints(args: { ownerClub: boolean; firstMission: boolean }): number {
  const base = PAW_REWARDS.missionCompleted + (args.firstMission ? PAW_REWARDS.firstMissionBonus : 0);
  return Math.round(base * (args.ownerClub ? OWNER_CLUB_PAW_MULTIPLIER : 1));
}
