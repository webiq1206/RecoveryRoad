import { useMemo } from 'react';

import { useHydratePledgesStore, usePledgeStreak, usePledgesStore, useTodayPledge } from '../../features/pledges/state/usePledgesStore';
import type { PledgesDomain } from '../contracts/pledges';

export function usePledges(): PledgesDomain {
  useHydratePledgesStore();
  const pledges = usePledgesStore.use.pledges();
  const todayPledge = useTodayPledge();
  const currentStreak = usePledgeStreak();
  const addPledge = usePledgesStore.use.addPledge();

  return useMemo(
    () => ({
      pledges,
      todayPledge,
      currentStreak,
      addPledge,
    }),
    [pledges, todayPledge, currentStreak, addPledge]
  );
}

