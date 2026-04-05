import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { JournalEntry } from '../../../types';
import { STORAGE_KEYS, loadStorageItem, saveStorageItem } from '../../../core/persistence';
import { createSelectors } from '../../../stores/zustand/createSelectors';

type JournalState = {
  journal: JournalEntry[];
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;
  addJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
};

const baseUseJournalStore = create<JournalState>()(
  subscribeWithSelector((set, get) => ({
    journal: [],
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const journal = await loadStorageItem<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
      set({ journal, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ journal: [], isLoading: false, hasHydrated: true });
    },

    addJournalEntry: (entry) => {
      const updated = [entry, ...get().journal];
      set({ journal: updated });
      void saveStorageItem(STORAGE_KEYS.JOURNAL, updated);
    },

    deleteJournalEntry: (id) => {
      const updated = get().journal.filter((e) => e.id !== id);
      set({ journal: updated });
      void saveStorageItem(STORAGE_KEYS.JOURNAL, updated);
    },
  }))
);

export const useJournalStore = createSelectors(baseUseJournalStore);

export function useHydrateJournalStore() {
  const hydrate = useJournalStore.use.hydrate();
  const hasHydrated = useJournalStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

