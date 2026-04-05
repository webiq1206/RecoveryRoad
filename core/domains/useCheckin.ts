import { useMemo } from 'react';
import {
  useCheckInsStore,
  useTodayCheckIns,
  useTodayCheckIn,
  useMorningCheckIn,
  useCurrentCheckInPeriod,
  useCurrentPeriodCheckIn,
  useHydrateCheckInsStore,
} from '../../stores/useCheckInsStore';
import { getLocalDateKey } from '../../utils/checkInDate';
import type { CheckinDomain } from '../contracts/checkin';

export function useCheckin(): CheckinDomain {
  useHydrateCheckInsStore();
  const {
    checkIns,
    nearMissEvents,
    addCheckIn,
    logNearMiss,
  } = useCheckInsStore();
  const todayCheckIns = useTodayCheckIns();
  const todayCheckIn = useTodayCheckIn();
  const morningCheckIn = useMorningCheckIn();
  const currentCheckInPeriod = useCurrentCheckInPeriod();
  const currentPeriodCheckIn = useCurrentPeriodCheckIn();

  const todayKey = useMemo(() => getLocalDateKey(), []);

  return useMemo(
    () => ({
      checkIns,
      nearMissEvents,
      addCheckIn,
      logNearMiss,
      todayKey,
      todayCheckIns,
      todayCheckIn,
      morningCheckIn,
      currentCheckInPeriod,
      currentPeriodCheckIn,
    }),
    [
      checkIns,
      nearMissEvents,
      addCheckIn,
      logNearMiss,
      todayKey,
      todayCheckIns,
      todayCheckIn,
      morningCheckIn,
      currentCheckInPeriod,
      currentPeriodCheckIn,
    ],
  );
}

