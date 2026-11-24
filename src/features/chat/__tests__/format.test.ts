import { dayLabel, formatFileSize, isImage } from '../format';

describe('chat format', () => {
  it('labels days', () => {
    const now = new Date('2026-11-25T15:00:00');
    expect(dayLabel('2026-11-25T08:00:00', now)).toBe('Aujourd’hui');
    expect(dayLabel('2026-11-24T23:00:00', now)).toBe('Hier');
  });
  it('formats sizes and detects images', () => {
    expect(formatFileSize(120000)).toBe('117 Ko');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2,5 Mo');
    expect(isImage('image/jpeg')).toBe(true);
    expect(isImage('application/pdf')).toBe(false);
  });
});
