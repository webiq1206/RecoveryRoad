import type { CheckInTimeOfDay, DailyCheckIn, NearMissEvent } from '../../types';

export interface CheckinDomainState {
  checkIns: DailyCheckIn[];
  nearMissEvents: NearMissEvent[];
}

export interface CheckinDomainDerived {
  todayKey: string;
  todayCheckIns: DailyCheckIn[];
  todayCheckIn: DailyCheckIn | null;
  morningCheckIn: DailyCheckIn | null;
  currentCheckInPeriod: CheckInTimeOfDay;
  currentPeriodCheckIn: DailyCheckIn | null;
}

export interface CheckinDomainCommands {
  addCheckIn: (checkIn: DailyCheckIn) => void;
  logNearMiss: (event: NearMissEvent) => void;
}

export type CheckinDomain = CheckinDomainState & CheckinDomainDerived & CheckinDomainCommands;

export function selectTodayKey(now = new Date()): string {
  return now.toISOString().split('T')[0];
}

export function selectCurrentCheckInPeriod(now = new Date()): CheckInTimeOfDay {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function selectTodayCheckIns(checkIns: DailyCheckIn[], todayKey: string): DailyCheckIn[] {
  return checkIns.filter((c) => c.date === todayKey);
}

export function selectLatestCheckInForDate(
  checkIns: DailyCheckIn[],
  dateKey: string,
): DailyCheckIn | null {
  const sameDay = checkIns.filter((c) => c.date === dateKey);
  if (sameDay.length === 0) return null;
  return sameDay.reduce((latest, c) =>
    new Date(c.completedAt).getTime() > new Date(latest.completedAt).getTime() ? c : latest
  );
}

export function selectCheckInForPeriod(
  checkIns: DailyCheckIn[],
  dateKey: string,
  period: CheckInTimeOfDay,
): DailyCheckIn | null {
  return checkIns.find((c) => c.date === dateKey && c.timeOfDay === period) ?? null;
}

