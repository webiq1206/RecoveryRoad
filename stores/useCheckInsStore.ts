/**
 * Check-ins slice: checkIns, nearMissEvents, and derived today/period state.
 * Consumed by RecoveryProvider (facade). Can be used directly by check-in screens.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DailyCheckIn, CheckInTimeOfDay, NearMissEvent } from '@/types';
import {
  STORAGE_KEYS,
  loadStorageItem,
  saveStorageItem,
} from '@/lib/recoveryDefaults';

export function useCheckInsStore() {
  const queryClient = useQueryClient();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [nearMissEvents, setNearMissEvents] = useState<NearMissEvent[]>([]);

  const checkInsQuery = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => loadStorageItem<DailyCheckIn[]>(STORAGE_KEYS.CHECK_INS, []),
    staleTime: Infinity,
  });

  const nearMissQuery = useQuery({
    queryKey: ['nearMissEvents'],
    queryFn: () =>
      loadStorageItem<NearMissEvent[]>(STORAGE_KEYS.NEAR_MISS_EVENTS, []),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (checkInsQuery.data) setCheckIns(checkInsQuery.data);
  }, [checkInsQuery.data]);

  useEffect(() => {
    if (nearMissQuery.data) setNearMissEvents(nearMissQuery.data);
  }, [nearMissQuery.data]);

  const saveCheckInsMutation = useMutation({
    mutationFn: (newCheckIns: DailyCheckIn[]) =>
      saveStorageItem(STORAGE_KEYS.CHECK_INS, newCheckIns),
    onSuccess: (data) => {
      setCheckIns(data);
      queryClient.setQueryData(['checkIns'], data);
    },
  });

  const saveNearMissMutation = useMutation({
    mutationFn: (events: NearMissEvent[]) =>
      saveStorageItem(STORAGE_KEYS.NEAR_MISS_EVENTS, events),
    onSuccess: (data) => {
      setNearMissEvents(data);
      queryClient.setQueryData(['nearMissEvents'], data);
    },
  });

  const addCheckIn = useCallback(
    (checkIn: DailyCheckIn) => {
      const updated = [checkIn, ...checkIns];
      setCheckIns(updated);
      saveCheckInsMutation.mutate(updated);
    },
    [checkIns]
  );

  const logNearMiss = useCallback(
    (event: NearMissEvent) => {
      const updated = [event, ...nearMissEvents];
      setNearMissEvents(updated);
      saveNearMissMutation.mutate(updated);
    },
    [nearMissEvents]
  );

  const todayCheckIns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkIns.filter((c) => c.date === today);
  }, [checkIns]);

  const todayCheckIn = useMemo(() => {
    if (todayCheckIns.length === 0) return null;
    return todayCheckIns.reduce((latest, c) =>
      new Date(c.completedAt).getTime() > new Date(latest.completedAt).getTime()
        ? c
        : latest,
    todayCheckIns[0]);
  }, [todayCheckIns]);

  const morningCheckIn = useMemo(() => {
    return todayCheckIns.find((c) => c.timeOfDay === 'morning') ?? null;
  }, [todayCheckIns]);

  const currentCheckInPeriod = useMemo((): CheckInTimeOfDay => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }, []);

  const currentPeriodCheckIn = useMemo(() => {
    return todayCheckIns.find((c) => c.timeOfDay === currentCheckInPeriod) ?? null;
  }, [todayCheckIns, currentCheckInPeriod]);

  const isLoading = checkInsQuery.isLoading || nearMissQuery.isLoading;

  return useMemo(
    () => ({
      checkIns,
      nearMissEvents,
      addCheckIn,
      logNearMiss,
      todayCheckIns,
      todayCheckIn,
      morningCheckIn,
      currentCheckInPeriod,
      currentPeriodCheckIn,
      isLoading,
    }),
    [
      checkIns,
      nearMissEvents,
      addCheckIn,
      logNearMiss,
      todayCheckIns,
      todayCheckIn,
      morningCheckIn,
      currentCheckInPeriod,
      currentPeriodCheckIn,
      isLoading,
    ]
  );
}
