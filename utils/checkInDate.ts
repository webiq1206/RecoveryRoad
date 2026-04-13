/**
 * Calendar day key for daily check-ins (local timezone).
 * Using local YYYY-MM-DD keeps morning/afternoon/evening on the same "today"
 * as the home screen, avoiding UTC midnight splits from toISOString().
 */
export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Whole local calendar days since sober date (midnight-to-midnight in the device timezone).
 * Day 0 = the calendar day of `soberDateValue` through local 11:59:59 p.m.
 */
export function countLocalCalendarDaysSinceSober(
  soberDateValue: string,
  now: Date = new Date(),
): number {
  if (!soberDateValue) return 0;
  const sober = new Date(soberDateValue);
  if (Number.isNaN(sober.getTime())) return 0;
  const startKey = getLocalDateKey(sober);
  const endKey = getLocalDateKey(now);
  const [sy, sm, sd] = startKey.split('-').map((x) => parseInt(x, 10));
  const [ey, em, ed] = endKey.split('-').map((x) => parseInt(x, 10));
  const t0 = new Date(sy, sm - 1, sd).getTime();
  const t1 = new Date(ey, em - 1, ed).getTime();
  return Math.max(0, Math.round((t1 - t0) / 86400000));
}
