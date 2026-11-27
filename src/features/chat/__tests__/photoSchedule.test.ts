import { currentPhotoSlot, photoSchedule } from '../photoSchedule';

const H = 3600_000;
const start = Date.UTC(2026, 10, 27, 10);

describe('photoSchedule', () => {
  it('creates a slot every 48 h during the mission (7 days → days 2, 4, 6)', () => {
    const slots = photoSchedule({ startedAt: start, days: 7, photoTimes: [], now: start });
    expect(slots.map((s) => s.day)).toEqual([2, 4, 6]);
    expect(slots.every((s) => s.status === 'upcoming')).toBe(true);
  });

  it('becomes due 12 h before the deadline, late 6 h after', () => {
    expect(photoSchedule({ startedAt: start, days: 7, photoTimes: [], now: start + 37 * H })[0].status).toBe('due');
    expect(photoSchedule({ startedAt: start, days: 7, photoTimes: [], now: start + 55 * H })[0].status).toBe('late');
  });

  it('a photo sent in the window satisfies the slot and moves the highlight to the next one', () => {
    const slots = photoSchedule({ startedAt: start, days: 7, photoTimes: [start + 40 * H], now: start + 41 * H });
    expect(slots[0].status).toBe('done');
    expect(currentPhotoSlot(slots)?.day).toBe(4);
  });

  it('one photo never satisfies two slots', () => {
    const slots = photoSchedule({ startedAt: start, days: 7, photoTimes: [start + 48 * H + 60_000], now: start + 49 * H });
    expect(slots.map((s) => s.status)).toEqual(['done', 'upcoming', 'upcoming']);
  });

  it('short missions (2 days) have no 48 h slot', () => {
    expect(photoSchedule({ startedAt: start, days: 2, photoTimes: [], now: start })).toEqual([]);
  });
});
