import { useMemo } from 'react';

import { useHydrateJournalStore, useJournalStore } from '../../features/journal/state/useJournalStore';
import type { JournalDomain } from '../contracts/journal';

export function useJournal(): JournalDomain {
  useHydrateJournalStore();
  const journal = useJournalStore.use.journal();
  const addJournalEntry = useJournalStore.use.addJournalEntry();
  const deleteJournalEntry = useJournalStore.use.deleteJournalEntry();

  return useMemo(
    () => ({
      journal,
      addJournalEntry,
      deleteJournalEntry,
    }),
    [journal, addJournalEntry, deleteJournalEntry]
  );
}

