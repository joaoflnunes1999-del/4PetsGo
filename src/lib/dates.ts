const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const toIsoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** "lun. 1 déc." */
export function formatDay(iso: string): string {
  const d = fromIso(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatRange(startIso: string, days: number): string {
  if (days <= 1) return formatDay(startIso);
  const end = fromIso(startIso);
  end.setDate(end.getDate() + days - 1);
  return `${formatDay(startIso)} → ${formatDay(toIsoDay(end))}`;
}

export function nextDays(count: number, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    out.push(toIsoDay(d));
  }
  return out;
}

/** "il reste 47 h" / "il reste 25 min" / "expirée". */
export function formatTimeLeft(expiresAtIso: string, now = Date.now()): string {
  const ms = new Date(expiresAtIso).getTime() - now;
  if (ms <= 0) return 'expirée';
  const h = Math.floor(ms / 3600_000);
  if (h >= 1) return `il reste ${h} h`;
  return `il reste ${Math.max(1, Math.round(ms / 60_000))} min`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
