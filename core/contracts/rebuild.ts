import type { ConfidenceMilestone, IdentityExerciseResponse, IdentityValue, PurposeGoal, RebuildData, ReplacementHabit, RoutineBlock } from '../../types';

export interface RebuildDomainState {
  rebuildData: RebuildData;
}

export interface RebuildDomainCommands {
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
}

export type RebuildDomain = RebuildDomainState & RebuildDomainCommands;

