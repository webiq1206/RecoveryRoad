import { useMemo } from 'react';

import { useHydrateWorkbookStore, useWorkbookStore } from '../../features/workbook/state/useWorkbookStore';
import type { WorkbookDomain } from '../contracts/workbook';

export function useWorkbook(): WorkbookDomain {
  useHydrateWorkbookStore();
  const saveWorkbookAnswer = useWorkbookStore.use.saveWorkbookAnswer();
  const getWorkbookAnswer = useWorkbookStore.use.getWorkbookAnswer();
  const getSectionProgress = useWorkbookStore.use.getSectionProgress();

  return useMemo(
    () => ({
      saveWorkbookAnswer,
      getWorkbookAnswer,
      getSectionProgress,
    }),
    [saveWorkbookAnswer, getWorkbookAnswer, getSectionProgress]
  );
}

