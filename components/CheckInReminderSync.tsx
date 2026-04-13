import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useCheckin } from '../core/domains/useCheckin';
import { useAppStore } from '../stores/useAppStore';
import { mergeTodayCheckInsFromSources } from '../utils/mergeProfile';
import { getLocalDateKey } from '../utils/checkInDate';
import { syncCheckInWindowReminders } from '../utils/syncCheckInWindowReminders';

/**
 * Keeps OS check-in window reminders aligned with completion state and local time.
 * Renders nothing; must live under providers that hydrate check-in data.
 */
export function CheckInReminderSync() {
  const { todayCheckIns: sliceToday } = useCheckin();
  const centralDailyCheckIns = useAppStore((s) => s.dailyCheckIns);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setTick((n) => n + 1);
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  const merged = useMemo(() => {
    const key = getLocalDateKey();
    return mergeTodayCheckInsFromSources(sliceToday ?? [], centralDailyCheckIns, key);
  }, [sliceToday, centralDailyCheckIns, tick]);

  useEffect(() => {
    void syncCheckInWindowReminders({ todayCheckIns: merged });
  }, [merged]);

  return null;
}
