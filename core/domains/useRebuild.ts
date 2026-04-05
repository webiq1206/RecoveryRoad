import { useMemo } from 'react';

import { useHydrateRebuildStore, useRebuildStore } from '../../features/rebuild/state/useRebuildStore';
import type { RebuildDomain } from '../contracts/rebuild';

export function useRebuild(): RebuildDomain {
  useHydrateRebuildStore();
  const rebuildData = useRebuildStore.use.rebuildData();
  const addReplacementHabit = useRebuildStore.use.addReplacementHabit();
  const updateReplacementHabit = useRebuildStore.use.updateReplacementHabit();
  const deleteReplacementHabit = useRebuildStore.use.deleteReplacementHabit();
  const addRoutineBlock = useRebuildStore.use.addRoutineBlock();
  const updateRoutineBlock = useRebuildStore.use.updateRoutineBlock();
  const deleteRoutineBlock = useRebuildStore.use.deleteRoutineBlock();
  const addPurposeGoal = useRebuildStore.use.addPurposeGoal();
  const updatePurposeGoal = useRebuildStore.use.updatePurposeGoal();
  const deletePurposeGoal = useRebuildStore.use.deletePurposeGoal();
  const addConfidenceMilestone = useRebuildStore.use.addConfidenceMilestone();
  const resetRoutineCompletion = useRebuildStore.use.resetRoutineCompletion();
  const startIdentityProgram = useRebuildStore.use.startIdentityProgram();
  const saveExerciseResponse = useRebuildStore.use.saveExerciseResponse();
  const completeModule = useRebuildStore.use.completeModule();
  const advanceIdentityWeek = useRebuildStore.use.advanceIdentityWeek();
  const addIdentityValue = useRebuildStore.use.addIdentityValue();
  const removeIdentityValue = useRebuildStore.use.removeIdentityValue();

  return useMemo(
    () => ({
      rebuildData,
      addReplacementHabit,
      updateReplacementHabit,
      deleteReplacementHabit,
      addRoutineBlock,
      updateRoutineBlock,
      deleteRoutineBlock,
      addPurposeGoal,
      updatePurposeGoal,
      deletePurposeGoal,
      addConfidenceMilestone,
      resetRoutineCompletion,
      startIdentityProgram,
      saveExerciseResponse,
      completeModule,
      advanceIdentityWeek,
      addIdentityValue,
      removeIdentityValue,
    }),
    [
      rebuildData,
      addReplacementHabit,
      updateReplacementHabit,
      deleteReplacementHabit,
      addRoutineBlock,
      updateRoutineBlock,
      deleteRoutineBlock,
      addPurposeGoal,
      updatePurposeGoal,
      deletePurposeGoal,
      addConfidenceMilestone,
      resetRoutineCompletion,
      startIdentityProgram,
      saveExerciseResponse,
      completeModule,
      advanceIdentityWeek,
      addIdentityValue,
      removeIdentityValue,
    ]
  );
}

