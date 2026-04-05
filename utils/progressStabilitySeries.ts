/**
 * Build calendar-aligned stability series for Progress charts.
 * One value per day: when multiple check-ins exist on the same date, the latest by `completedAt` wins.
 */

import type { CheckInTimeOfDay, DailyCheckIn } from '../types';

export type StabilityWindowDays = 7 | 14 | 30;

export type ProgressStabilitySeries = {
  dates: string[];
  scores: (number | null)[];
};

export type BuildProgressStabilitySeriesOptions = {
  /** When set, only check-ins for this time-of-day slot are used (e.g. morning-only chart). */
  timeOfDay?: CheckInTimeOfDay;
};

export function buildProgressStabilitySeries(
  checkIns: DailyCheckIn[],
  windowDays: StabilityWindowDays,
  options?: BuildProgressStabilitySeriesOptions
): ProgressStabilitySeries {
  const filtered =
    options?.timeOfDay != null
      ? checkIns.filter((c) => c.timeOfDay === options.timeOfDay)
      : checkIns;

  const today = new Date();
  const dates: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const byDayBuckets = new Map<string, DailyCheckIn[]>();
  for (const c of filtered) {
    const list = byDayBuckets.get(c.date);
    if (list) list.push(c);
    else byDayBuckets.set(c.date, [c]);
  }

  const byDate = new Map<string, number>();
  for (const [day, list] of byDayBuckets) {
    if (!dates.includes(day)) continue;
    const best = list.reduce((a, b) => (a.completedAt >= b.completedAt ? a : b));
    const raw = best.stabilityScore;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      byDate.set(day, Math.min(100, Math.max(0, raw)));
    }
  }

  const scores = dates.map((d) => byDate.get(d) ?? null);
  return { dates, scores };
}

const DAILY_AVERAGE_SLOTS: CheckInTimeOfDay[] = ['morning', 'afternoon', 'evening'];

/**
 * One value per calendar day: mean of morning / afternoon / evening stability scores
 * (latest check-in per slot when multiple exist). Days with no check-ins in any slot are null.
 */
export function buildDailyAverageStabilitySeries(
  checkIns: DailyCheckIn[],
  windowDays: StabilityWindowDays,
): ProgressStabilitySeries {
  const today = new Date();
  const dates: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const byDay = new Map<string, DailyCheckIn[]>();
  for (const c of checkIns) {
    const list = byDay.get(c.date);
    if (list) list.push(c);
    else byDay.set(c.date, [c]);
  }

  const byDate = new Map<string, number>();
  for (const day of dates) {
    const list = byDay.get(day);
    if (!list) continue;
    const slotScores: number[] = [];
    for (const slot of DAILY_AVERAGE_SLOTS) {
      const inSlot = list.filter((c) => c.timeOfDay === slot);
      if (inSlot.length === 0) continue;
      const best = inSlot.reduce((a, b) => (a.completedAt >= b.completedAt ? a : b));
      const raw = best.stabilityScore;
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        slotScores.push(Math.min(100, Math.max(0, raw)));
      }
    }
    if (slotScores.length === 0) continue;
    const avg = slotScores.reduce((a, b) => a + b, 0) / slotScores.length;
    if (Number.isFinite(avg)) byDate.set(day, avg);
  }

  const scores = dates.map((d) => byDate.get(d) ?? null);
  return { dates, scores };
}

/** Mean of morning / afternoon / evening stability for `dateStr` (latest per slot). Null if no slot has data. */
export function computeDailyAverageScoreForDate(
  checkIns: DailyCheckIn[],
  dateStr: string,
): number | null {
  const dayRows = checkIns.filter((c) => c.date === dateStr);
  if (dayRows.length === 0) return null;
  const vals: number[] = [];
  for (const slot of DAILY_AVERAGE_SLOTS) {
    const inSlot = dayRows.filter((c) => c.timeOfDay === slot);
    if (inSlot.length === 0) continue;
    const best = inSlot.reduce((a, b) => (a.completedAt >= b.completedAt ? a : b));
    const raw = best.stabilityScore;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      vals.push(Math.min(100, Math.max(0, raw)));
    }
  }
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function isFiniteScore(x: number | null | undefined): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

/** 3-day trailing average per index (uses up to scores[i-2..i], only finite scores). */
export function computeTrailingAverage3(scores: (number | null)[]): (number | null)[] {
  return scores.map((_, i) => {
    const slice = [scores[i - 2], scores[i - 1], scores[i]].filter(isFiniteScore);
    if (slice.length === 0) return null;
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return Number.isFinite(avg) ? avg : null;
  });
}

export function countNonNullScores(scores: (number | null)[]): number {
  return scores.filter(isFiniteScore).length;
}
