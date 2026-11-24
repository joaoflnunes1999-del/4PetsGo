import { levelFor, levelProgress, missionPawPoints } from '../levels';

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
