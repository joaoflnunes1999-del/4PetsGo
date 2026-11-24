import { DEMO_SITTERS } from '../demoSitters';
import { sitterFacts, sitterHighlights } from '../facts';

const byId = (id: string) => DEMO_SITTERS.find((s) => s.id === id)!;

describe('sitter facts', () => {
  it('lists age first, then home details before experience', () => {
    const keys = sitterFacts(byId('sitter-ines')).map((f) => f.key);
    expect(keys[0]).toBe('age');
    expect(keys.slice(1, 6)).toEqual(['housing', 'balcony', 'garden', 'children', 'animals']);
    expect(keys.indexOf('experience')).toBeGreaterThan(keys.indexOf('animals'));
  });

  it('has no home facts for sitters who do not offer boarding', () => {
    const keys = sitterFacts(byId('sitter-julien')).map((f) => f.key);
    expect(keys).toEqual(['age', 'experience', 'radius']);
  });

  it('builds short highlights for result cards', () => {
    expect(sitterHighlights(byId('sitter-ines'))).toEqual(['41 ans', 'Maison 120 m²', 'Jardin', 'Enfants', 'Sans animaux']);
    expect(sitterHighlights(byId('sitter-camille'))).toContain('Animaux au foyer');
  });
});
