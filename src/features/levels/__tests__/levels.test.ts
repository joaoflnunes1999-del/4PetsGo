import { countWords, firstNightReward, levelFor, levelProgress, missionPawPoints } from '../levels';

describe('levels', () => {
  it('uses the indicative thresholds', () => {
    expect(levelFor(0).id).toBe('beginner');
    expect(levelFor(199).id).toBe('beginner');
    expect(levelFor(200).id).toBe('explorer');
    expect(levelFor(1499).id).toBe('advanced');
    expect(levelFor(1500).id).toBe('expert');
    expect(levelFor(3000).id).toBe('master');
  });

  it('computes progress to next level', () => {
    const p = levelProgress(400);
    expect(p.next?.id).toBe('advanced');
    expect(p.remaining).toBe(200);
    expect(p.progress).toBeCloseTo(0.5);
    expect(levelProgress(5000).next).toBeUndefined();
  });

  it('applies the Owner Club ×1.5 multiplier to mission points', () => {
    expect(missionPawPoints({ ownerClub: false, firstMission: false })).toBe(30);
    expect(missionPawPoints({ ownerClub: true, firstMission: false })).toBe(45);
  });
});

describe('First Night Update reward', () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ');
  it('gives 5 + 1 per answer = 7 without a detailed comment', () => {
    expect(firstNightReward({ answers: 2 })).toBe(7);
    expect(firstNightReward({ answers: 2, comment: words(15) })).toBe(7);
  });
  it('gives 8 + 1 per answer = 10 with a comment of more than 15 words', () => {
    expect(firstNightReward({ answers: 2, comment: words(16) })).toBe(10);
  });
  it('counts words on any whitespace', () => {
    expect(countWords('  Il a  dormi\nau pied du lit  ')).toBe(7);
    expect(countWords('')).toBe(0);
  });
});
