import { useMemo } from 'react';
import { useHydrateRecoveryProfileStore, useRecoveryProfileStore } from '../../stores/useRecoveryProfileStore';
import type { RelapseDomain } from '../contracts/relapse';

export function useRelapse(): RelapseDomain {
  useHydrateRecoveryProfileStore();
  const relapsePlan = useRecoveryProfileStore.use.relapsePlan();
  const saveRelapsePlan = useRecoveryProfileStore.use.saveRelapsePlan();
  const timelineEvents = useRecoveryProfileStore.use.timelineEvents();
  const logRelapse = useRecoveryProfileStore.use.logRelapse();
  const logCrisisActivation = useRecoveryProfileStore.use.logCrisisActivation();

  return useMemo(
    () => ({
      relapsePlan,
      timelineEvents,
      saveRelapsePlan,
      logRelapse,
      logCrisisActivation,
    }),
    [
      relapsePlan,
      timelineEvents,
      saveRelapsePlan,
      logRelapse,
      logCrisisActivation,
    ],
  );
}

