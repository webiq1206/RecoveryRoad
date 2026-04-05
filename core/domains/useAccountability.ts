import { useMemo } from 'react';

import { useAccountabilityStore, useHydrateAccountabilityStore } from '../../features/accountability/state/useAccountabilityStore';
import type { AccountabilityDomain } from '../contracts/accountability';

export function useAccountability(): AccountabilityDomain {
  useHydrateAccountabilityStore();
  const accountabilityData = useAccountabilityStore.use.accountabilityData();
  const addContract = useAccountabilityStore.use.addContract();
  const updateContract = useAccountabilityStore.use.updateContract();
  const deleteContract = useAccountabilityStore.use.deleteContract();
  const checkInContract = useAccountabilityStore.use.checkInContract();
  const addPartner = useAccountabilityStore.use.addPartner();
  const deletePartner = useAccountabilityStore.use.deletePartner();
  const useStreakProtection = useAccountabilityStore.use.useStreakProtection();

  return useMemo(
    () => ({
      accountabilityData,
      addContract,
      updateContract,
      deleteContract,
      checkInContract,
      addPartner,
      deletePartner,
      useStreakProtection,
    }),
    [
      accountabilityData,
      addContract,
      updateContract,
      deleteContract,
      checkInContract,
      addPartner,
      deletePartner,
      useStreakProtection,
    ]
  );
}

