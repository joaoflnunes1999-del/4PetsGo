/**
 * Mandatory mission photos every 48 h (PRD §3.9). Slot k is due at start + k × 48 h and is satisfied by a photo
 * sent by the sitter during its window (after the previous slot, up to 6 h after the due time).
 * A photo satisfies a single slot.
 * Mirrors private.photo_reminders_due() on the server.
 */
export const PHOTO_INTERVAL_HOURS = 48;
export const PHOTO_GRACE_HOURS = 6;
/** The reminder becomes active this many hours before the due time. */
export const PHOTO_REMINDER_LEAD_HOURS = 12;

export type PhotoSlotStatus = 'done' | 'due' | 'late' | 'upcoming';
export type PhotoSlot = { index: number; day: number; dueAt: number; status: PhotoSlotStatus };

const H = 3600_000;

export function photoSchedule(args: { startedAt: number; days: number; photoTimes: number[]; now: number }): PhotoSlot[] {
  const end = args.startedAt + args.days * 24 * H;
  const slots: PhotoSlot[] = [];
  // Each photo counts for ONE slot only (windows overlap because of the grace period).
  const unused = [...args.photoTimes].sort((a, b) => a - b);
  for (let k = 1; args.startedAt + k * PHOTO_INTERVAL_HOURS * H < end; k++) {
    const dueAt = args.startedAt + k * PHOTO_INTERVAL_HOURS * H;
    const from = dueAt - PHOTO_INTERVAL_HOURS * H;
    const to = dueAt + PHOTO_GRACE_HOURS * H;
    const hit = unused.findIndex((t) => t > from && t <= to);
    const done = hit >= 0;
    if (done) unused.splice(hit, 1);
    let status: PhotoSlotStatus = 'upcoming';
    if (done) status = 'done';
    else if (args.now > to) status = 'late';
    else if (args.now >= dueAt - PHOTO_REMINDER_LEAD_HOURS * H) status = 'due';
    slots.push({ index: k, day: k * 2, dueAt, status });
  }
  return slots;
}

/** The slot to highlight: the current due one, otherwise the next upcoming one. */
export function currentPhotoSlot(slots: PhotoSlot[]): PhotoSlot | undefined {
  return slots.find((s) => s.status === 'due') ?? slots.find((s) => s.status === 'upcoming');
}
