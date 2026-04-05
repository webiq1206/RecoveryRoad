import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type {
  ConfidenceMilestone,
  IdentityExerciseResponse,
  IdentityValue,
  PurposeGoal,
  RebuildData,
  ReplacementHabit,
  RoutineBlock,
} from '../../../types';
import { DEFAULT_IDENTITY_PROGRAM, DEFAULT_REBUILD, STORAGE_KEYS, loadStorageItem, saveStorageItem } from '../../../core/persistence';
import { createSelectors } from '../../../stores/zustand/createSelectors';

type RebuildState = {
  rebuildData: RebuildData;
  isLoading: boolean;
  hasHydrated: boolean;

  hydrate: () => Promise<void>;
  reset: () => void;

  addReplacementHabit: (habit: ReplacementHabit) => void;
  updateReplacementHabit: (id: string, updates: Partial<ReplacementHabit>) => void;
  deleteReplacementHabit: (id: string) => void;

  addRoutineBlock: (block: RoutineBlock) => void;
  updateRoutineBlock: (id: string, updates: Partial<RoutineBlock>) => void;
  deleteRoutineBlock: (id: string) => void;

  addPurposeGoal: (goal: PurposeGoal) => void;
  updatePurposeGoal: (id: string, updates: Partial<PurposeGoal>) => void;
  deletePurposeGoal: (id: string) => void;

  addConfidenceMilestone: (milestone: ConfidenceMilestone) => void;
  resetRoutineCompletion: () => void;

  startIdentityProgram: () => void;
  saveExerciseResponse: (response: IdentityExerciseResponse) => void;
  completeModule: (moduleId: string) => void;
  advanceIdentityWeek: () => void;
  addIdentityValue: (value: IdentityValue) => void;
  removeIdentityValue: (id: string) => void;
};

function persist(set: (partial: Partial<RebuildState>) => void, data: RebuildData) {
  set({ rebuildData: data });
  void saveStorageItem(STORAGE_KEYS.REBUILD, data);
}

const baseUseRebuildStore = create<RebuildState>()(
  subscribeWithSelector((set, get) => ({
    rebuildData: DEFAULT_REBUILD,
    isLoading: true,
    hasHydrated: false,

    hydrate: async () => {
      if (get().hasHydrated) return;
      set({ isLoading: true });
      const rebuildData = await loadStorageItem<RebuildData>(STORAGE_KEYS.REBUILD, DEFAULT_REBUILD);
      set({ rebuildData, isLoading: false, hasHydrated: true });
    },

    reset: () => {
      set({ rebuildData: DEFAULT_REBUILD, isLoading: false, hasHydrated: true });
    },

    addReplacementHabit: (habit) => {
      const d = get().rebuildData;
      persist(set, { ...d, habits: [habit, ...d.habits] });
    },
    updateReplacementHabit: (id, updates) => {
      const d = get().rebuildData;
      persist(set, { ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) });
    },
    deleteReplacementHabit: (id) => {
      const d = get().rebuildData;
      persist(set, { ...d, habits: d.habits.filter((h) => h.id !== id) });
    },

    addRoutineBlock: (block) => {
      const d = get().rebuildData;
      persist(set, { ...d, routines: [block, ...d.routines] });
    },
    updateRoutineBlock: (id, updates) => {
      const d = get().rebuildData;
      persist(set, { ...d, routines: d.routines.map((b) => (b.id === id ? { ...b, ...updates } : b)) });
    },
    deleteRoutineBlock: (id) => {
      const d = get().rebuildData;
      persist(set, { ...d, routines: d.routines.filter((b) => b.id !== id) });
    },

    addPurposeGoal: (goal) => {
      const d = get().rebuildData;
      persist(set, { ...d, goals: [goal, ...d.goals] });
    },
    updatePurposeGoal: (id, updates) => {
      const d = get().rebuildData;
      persist(set, { ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) });
    },
    deletePurposeGoal: (id) => {
      const d = get().rebuildData;
      persist(set, { ...d, goals: d.goals.filter((g) => g.id !== id) });
    },

    addConfidenceMilestone: (milestone) => {
      const d = get().rebuildData;
      persist(set, { ...d, confidenceMilestones: [milestone, ...d.confidenceMilestones] });
    },

    resetRoutineCompletion: () => {
      const d = get().rebuildData;
      // Conservative: just clear completion flags if they exist.
      persist(set, {
        ...d,
        routines: d.routines.map((b: any) => ({ ...b, completedToday: false })),
      });
    },

    startIdentityProgram: () => {
      const d = get().rebuildData;
      const identityProgram = {
        ...DEFAULT_IDENTITY_PROGRAM,
        startedAt: new Date().toISOString(),
      };
      persist(set, { ...d, identityProgram });
    },

    saveExerciseResponse: (response) => {
      const d = get().rebuildData;
      const program = d.identityProgram ?? DEFAULT_IDENTITY_PROGRAM;
      persist(set, { ...d, identityProgram: { ...program, exerciseResponses: [response, ...(program.exerciseResponses ?? [])] } });
    },

    completeModule: (moduleId) => {
      const d = get().rebuildData;
      const program = d.identityProgram ?? DEFAULT_IDENTITY_PROGRAM;
      const completed = program.completedModuleIds ?? [];
      if (completed.includes(moduleId)) return;
      persist(set, { ...d, identityProgram: { ...program, completedModuleIds: [moduleId, ...completed] } });
    },

    advanceIdentityWeek: () => {
      const d = get().rebuildData;
      const program = d.identityProgram ?? DEFAULT_IDENTITY_PROGRAM;
      persist(set, { ...d, identityProgram: { ...program, currentWeek: Math.max(1, (program.currentWeek ?? 1) + 1) } });
    },

    addIdentityValue: (value) => {
      const d = get().rebuildData;
      const program = d.identityProgram ?? DEFAULT_IDENTITY_PROGRAM;
      const values = program.values ?? [];
      persist(set, { ...d, identityProgram: { ...program, values: [value, ...values] } });
    },

    removeIdentityValue: (id) => {
      const d = get().rebuildData;
      const program = d.identityProgram ?? DEFAULT_IDENTITY_PROGRAM;
      const values = program.values ?? [];
      persist(set, { ...d, identityProgram: { ...program, values: values.filter((v) => v.id !== id) } });
    },
  }))
);

export const useRebuildStore = createSelectors(baseUseRebuildStore);

export function useHydrateRebuildStore() {
  const hydrate = useRebuildStore.use.hydrate();
  const hasHydrated = useRebuildStore.use.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) void hydrate();
  }, [hasHydrated, hydrate]);
}

