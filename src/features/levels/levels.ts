import type { LevelId } from '@/domain/types';
import type { IconName } from '@/components/ui/Icon';

export type Level = {
  id: LevelId;
  name: string;
  animal: string;
  icon: IconName;
  minPoints: number;
};

/** ⚠️ Seuils indicatifs (PRD §3.10) — configurable. */
export const LEVELS: readonly Level[] = [
  { id: 'beginner', name: 'Beginner', animal: 'Canari', icon: 'mci:bird', minPoints: 0 },
  { id: 'explorer', name: 'Explorer', animal: 'Lapin', icon: 'mci:rabbit', minPoints: 200 },
  { id: 'advanced', name: 'Advanced', animal: 'Chat', icon: 'mci:cat', minPoints: 600 },
  { id: 'expert', name: 'Expert', animal: 'Labrador', icon: 'mci:dog', minPoints: 1500 },
  { id: 'master', name: 'Master', animal: 'Doberman', icon: 'mci:dog-side', minPoints: 3000 },
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
export const PAW_REWARDS = { missionCompleted: 30, firstMissionBonus: 20, profileComplete: 20, scheduledPhoto: 2 } as const;
export const OWNER_CLUB_PAW_MULTIPLIER = 1.5;

/** Paw Points a sitter would earn for completing a mission (shown before acceptance). */
export function missionPawPoints(args: { ownerClub: boolean; firstMission: boolean }): number {
  const base = PAW_REWARDS.missionCompleted + (args.firstMission ? PAW_REWARDS.firstMissionBonus : 0);
  return Math.round(base * (args.ownerClub ? OWNER_CLUB_PAW_MULTIPLIER : 1));
}
