import { crownPlacement } from '../crown';

describe('crownPlacement', () => {
  it('places the crown on the rim, about 15° clockwise from the top, tilted 15°', () => {
    const p = crownPlacement(100);
    const centreX = p.left + p.crownSize / 2;
    expect(centreX).toBeCloseTo(50 + 50 * Math.sin((15 * Math.PI) / 180), 5); // right of the top centre
    expect(p.top).toBeLessThan(0); // overflows above the photo
    expect(p.rotateDeg).toBe(15);
  });
  it('scales with the avatar', () => {
    expect(crownPlacement(56).crownSize).toBe(26);
  });
});
