import { create } from 'zustand';
import { createSelectors } from './zustand/createSelectors';

export interface RelapsePlanDraft {
  warningSignsText: string;
  triggersText: string;
  copingStrategiesText: string;
  commitmentsText: string;
}

/**
 * Holds the relapse plan wizard's unsaved answers while the user steps away to
 * another screen — opening Connection to add support contacts tears the wizard
 * down, so its text has to live somewhere outside the component.
 *
 * Deliberately memory-only: a draft is a hand-off for the current session, not
 * something that should reappear days later in place of the saved plan.
 */
type RelapsePlanDraftStore = {
  draft: RelapsePlanDraft | null;
  saveDraft: (draft: RelapsePlanDraft) => void;
  clearDraft: () => void;
};

const baseStore = create<RelapsePlanDraftStore>()((set) => ({
  draft: null,

  saveDraft: (draft: RelapsePlanDraft) => set({ draft }),

  clearDraft: () => set({ draft: null }),
}));

export const useRelapsePlanDraftStore = createSelectors(baseStore);
