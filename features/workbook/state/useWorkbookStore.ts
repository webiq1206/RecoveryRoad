import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { WorkbookAnswer } from '../../../types';
import { STORAGE_KEYS, loadStorageItem, saveStorageItem } from '../../../core/persistence';
import { createSelectors } from '../../../stores/zustand/createSelectors';

type WorkbookState = {
  workbookAnswers: WorkbookAnswer[];
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;
  saveWorkbookAnswer: (answer: WorkbookAnswer) => void;
  getWorkbookAnswer: (sectionId: string, questionId: string) => WorkbookAnswer | null;
  getSectionProgress: (sectionId: string, totalQuestions: number) => number;
};

const baseUseWorkbookStore = create<WorkbookState>()(
  subscribeWithSelector((set, get) => ({
    workbookAnswers: [],
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const workbookAnswers = await loadStorageItem<WorkbookAnswer[]>(STORAGE_KEYS.WORKBOOK_ANSWERS, []);
      set({ workbookAnswers, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ workbookAnswers: [], isLoading: false, hasHydrated: true });
    },

    saveWorkbookAnswer: (answer) => {
      const existing = get().workbookAnswers;
      const updated = [answer, ...existing.filter((a) => !(a.sectionId === answer.sectionId && a.questionId === answer.questionId))];
      set({ workbookAnswers: updated });
      void saveStorageItem(STORAGE_KEYS.WORKBOOK_ANSWERS, updated);
    },

    getWorkbookAnswer: (sectionId, questionId) => {
      return get().workbookAnswers.find((a) => a.sectionId === sectionId && a.questionId === questionId) ?? null;
    },

    getSectionProgress: (sectionId, totalQuestions) => {
      if (totalQuestions <= 0) return 0;
      const completed = get().workbookAnswers.filter((a) => a.sectionId === sectionId).length;
      return Math.min(1, Math.max(0, completed / totalQuestions));
    },
  }))
);

export const useWorkbookStore = createSelectors(baseUseWorkbookStore);

export function useHydrateWorkbookStore() {
  const hydrate = useWorkbookStore.use.hydrate();
  const hasHydrated = useWorkbookStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

