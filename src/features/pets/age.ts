import type { PetProfile } from '@/domain/types';

/** "3 ans", "8 mois", "≈ 5 ans" (estimated). */
export function formatAge(pet: Pick<PetProfile, 'birthDate' | 'estimatedAgeYears'>, today = new Date()): string | undefined {
  if (pet.birthDate) {
    const b = new Date(`${pet.birthDate}T12:00:00Z`);
    if (Number.isNaN(b.getTime())) return undefined;
    let months = (today.getUTCFullYear() - b.getUTCFullYear()) * 12 + (today.getUTCMonth() - b.getUTCMonth());
    if (today.getUTCDate() < b.getUTCDate()) months -= 1;
    if (months < 0) return undefined;
    if (months < 12) return `${Math.max(months, 0)} mois`;
    const y = Math.floor(months / 12);
    return `${y} an${y > 1 ? 's' : ''}`;
  }
  if (pet.estimatedAgeYears != null) {
    const y = pet.estimatedAgeYears;
    return `≈ ${y} an${y > 1 ? 's' : ''}`;
  }
  return undefined;
}

/** Validates "JJ/MM/AAAA" and returns ISO date, or undefined. */
export function parseFrenchDate(text: string): string | undefined {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return undefined;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return undefined;
  if (date.getTime() > Date.now()) return undefined;
  return iso;
}

export function isoToFrench(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
