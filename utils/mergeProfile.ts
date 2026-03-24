/**
 * Merge persisted (central) and in-memory profile/check-in data without letting
 * empty objects `{}` clobber real recovery data — a common cause of wrong setup
 * progress and identical per-period stability scores.
 */

import type { DailyCheckIn, RecoveryProfile } from '@/types';

export function isRecoveryProfileEmpty(
  rp: RecoveryProfile | null | undefined,
): boolean {
  if (rp == null) return true;
  return typeof rp === 'object' && Object.keys(rp).length === 0;
}

/** Prefer non-empty persisted recovery data; merge field-level with central winning on conflict. */
export function mergeRecoveryProfiles(
  central: RecoveryProfile | null | undefined,
  local: RecoveryProfile | null | undefined,
): RecoveryProfile | undefined {
  const cEmpty = isRecoveryProfileEmpty(central);
  const lEmpty = isRecoveryProfileEmpty(local);
  if (cEmpty && lEmpty) return undefined;
  if (cEmpty) return local;
  if (lEmpty) return central;
  return { ...local!, ...central! };
}

const METRIC_KEYS: (keyof DailyCheckIn)[] = [
  'mood',
  'cravingLevel',
  'stress',
  'sleepQuality',
  'environment',
  'emotionalState',
  'stabilityScore',
];

function isNumericMetric(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

/** Merge two rows for the same date+period: newer wins, but fill missing metrics from the older row. */
export function mergeDailyCheckInForPeriod(a: DailyCheckIn, b: DailyCheckIn): DailyCheckIn {
  const aTime = new Date(a.completedAt).getTime();
  const bTime = new Date(b.completedAt).getTime();
  const newer = aTime >= bTime ? a : b;
  const older = aTime >= bTime ? b : a;
  const out: DailyCheckIn = { ...older, ...newer };
  for (const key of METRIC_KEYS) {
    const nv = newer[key];
    const ov = older[key];
    if (!isNumericMetric(nv) && isNumericMetric(ov)) {
      Object.assign(out, { [key]: ov });
    }
  }
  return out;
}

/** Combine check-ins slice rows for today with persisted app-store rows (per period, merged). */
export function mergeTodayCheckInsFromSources(
  sliceTodayRows: DailyCheckIn[],
  centralAllRows: DailyCheckIn[],
  todayStr: string,
): DailyCheckIn[] {
  const fromCentral = centralAllRows.filter((c) => c.date === todayStr);
  const byPeriod = new Map<string, DailyCheckIn>();
  for (const c of sliceTodayRows) {
    byPeriod.set(c.timeOfDay, c);
  }
  for (const c of fromCentral) {
    const existing = byPeriod.get(c.timeOfDay);
    if (!existing) {
      byPeriod.set(c.timeOfDay, c);
      continue;
    }
    byPeriod.set(c.timeOfDay, mergeDailyCheckInForPeriod(existing, c));
  }
  return Array.from(byPeriod.values());
}
