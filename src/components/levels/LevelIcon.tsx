import { Image } from 'expo-image';

import type { LevelId } from '@/domain/types';
import { LEVELS } from '@/features/levels/levels';

/** Numbered paw emblems (1 = Beginner … 5 = Master), supplied by the founder. */
const SOURCES: Record<LevelId, number> = {
  beginner: require('@/assets/images/levels/beginner.png'),
  explorer: require('@/assets/images/levels/explorer.png'),
  advanced: require('@/assets/images/levels/advanced.png'),
  expert: require('@/assets/images/levels/expert.png'),
  master: require('@/assets/images/levels/master.png'),
};

export function LevelIcon({ level, size = 24 }: { level: LevelId; size?: number }) {
  const l = LEVELS.find((x) => x.id === level)!;
  return (
    <Image
      source={SOURCES[level]}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel={`Niveau ${l.rank} · ${l.name}`}
    />
  );
}
