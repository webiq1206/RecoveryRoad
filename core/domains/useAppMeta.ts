import { useMemo } from 'react';

import { useAppMetaStore, useStabilityScore } from '../../features/appMeta/state/useAppMetaStore';
import type { AppMetaDomain } from '../contracts/appMeta';

export function useAppMeta(): AppMetaDomain {
  const stabilityScore = useStabilityScore();
  const resetAllData = useAppMetaStore.use.resetAllData();

  return useMemo(
    () => ({
      stabilityScore,
      resetAllData,
    }),
    [stabilityScore, resetAllData]
  );
}

