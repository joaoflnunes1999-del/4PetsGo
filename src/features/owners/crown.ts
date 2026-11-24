/**
 * Owner Club "skin": a crown sitting on the rim of the circular profile photo.
 * Angle is measured clockwise from 12 o'clock (founder: ≈ 15°); the crown is tilted by the same angle.
 */
export const OWNER_CLUB_CROWN_ANGLE_DEG = 15;

export function crownPlacement(avatarSize: number, angleDeg = OWNER_CLUB_CROWN_ANGLE_DEG) {
  const r = avatarSize / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const crownSize = Math.round(avatarSize * 0.46);
  // Point on the circle, then centre the crown on it.
  const cx = r + r * Math.sin(rad);
  const cy = r - r * Math.cos(rad);
  return {
    crownSize,
    left: cx - crownSize / 2,
    top: cy - crownSize / 2 - crownSize * 0.12, // lift slightly so the crown rests on the rim
    rotateDeg: angleDeg,
  };
}
