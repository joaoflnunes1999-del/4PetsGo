import { DEMO_SITTERS } from '../demoSitters';
import { sitterHighlights, sitterKeyTiles } from '../facts';

const byId = (id: string) => DEMO_SITTERS.find((s) => s.id === id)!;

describe('sitterHighlights', () => {
  it('builds short highlights for result cards', () => {
    expect(sitterHighlights(byId('sitter-ines'))).toEqual(['41 ans', 'Maison 120 m²', 'Jardin', 'Enfants', 'Sans animaux']);
    expect(sitterHighlights(byId('sitter-camille'))).toContain('Animaux au foyer');
  });
});

describe('sitterKeyTiles', () => {
  it('returns exactly 4 short tiles for boarding sitters: home, outdoor, children, animals', () => {
    const t = sitterKeyTiles(byId('sitter-ines'));
    expect(t).toHaveLength(4);
    expect(t.map((x) => x.value)).toEqual(['120 m²', 'Jardin', 'Enfants', 'Aucun']);
    expect(t[0].icon).toBe('mci:home-variant-outline');
    expect(sitterKeyTiles(byId('sitter-camille'))[0].icon).toBe('mci:office-building-outline');
    expect(sitterKeyTiles(byId('sitter-camille'))[1].value).toBe('Balcon');
  });
  it('falls back to radius, experience, missions, dogs for sitters without boarding', () => {
    const t = sitterKeyTiles(byId('sitter-yanis'));
    expect(t.map((x) => x.key)).toEqual(['radius', 'experience', 'missions', 'dogs']);
    expect(t.every((x) => x.value.length <= 13)).toBe(true);
  });
});
