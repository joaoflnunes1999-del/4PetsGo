import { formatAge, parseFrenchDate } from '../age';
import { getBreed, searchBreeds } from '../breeds';

describe('breeds', () => {
  it('searches accent-insensitively and lists the generic breed first', () => {
    const res = searchBreeds('dog', '');
    expect(res[0].id).toBe('dog-mixed');
    expect(searchBreeds('dog', 'epagneul').map((b) => b.id)).toContain('dog-epagneul-breton');
    expect(searchBreeds('cat', 'sacre')[0].id).toBe('cat-sacre-birmanie');
  });
  it('falls back to the generic breed for unknown ids', () => {
    expect(getBreed('dog-unknown').id).toBe('dog-mixed');
    expect(getBreed('cat-unknown').id).toBe('cat-mixed');
  });
});

describe('age', () => {
  const today = new Date('2026-11-24T12:00:00Z');
  it('formats months and years', () => {
    expect(formatAge({ birthDate: '2026-03-10' }, today)).toBe('8 mois');
    expect(formatAge({ birthDate: '2023-11-24' }, today)).toBe('3 ans');
    expect(formatAge({ birthDate: '2025-11-25' }, today)).toBe('11 mois');
    expect(formatAge({ estimatedAgeYears: 1 }, today)).toBe('≈ 1 an');
  });
  it('parses French dates strictly', () => {
    expect(parseFrenchDate('05/03/2021')).toBe('2021-03-05');
    expect(parseFrenchDate('31/02/2021')).toBeUndefined();
    expect(parseFrenchDate('2021-03-05')).toBeUndefined();
  });
});
