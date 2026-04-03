/**
 * Onboarding step detection helpers.
 * Daily guidance actions have been consolidated into utils/wizardEngine.ts.
 */

import type { UserProfile, RecoveryProfile, EmergencyContact } from '@/types';
import type { AccountabilityData } from '@/types';

// ---- Onboarding step IDs (match order used in onboarding.tsx) ----
export const ONBOARDING_STEP_IDS = [
  'identity',
  'addiction',
  'daily_spend',
  'stage',
  'calibration',
  'triggers',
  'goals',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export interface OnboardingStepDef {
  id: OnboardingStepId;
  /** 0-based index in the full flow (for copy like "Step 1 of 6") */
  fullIndex: number;
}

/** Detect which onboarding steps are already complete from profile/state */
export function getCompletedOnboardingSteps(
  profile: UserProfile,
  emergencyContacts: EmergencyContact[],
  accountabilityData: AccountabilityData | null
): Set<OnboardingStepId> {
  const completed = new Set<OnboardingStepId>();
  const rp = profile.recoveryProfile ?? ({} as RecoveryProfile);

  // Identity: name set or anonymous
  if (profile.privacyControls?.isAnonymous || (profile.name && profile.name.trim().length > 0)) {
    completed.add('identity');
  }

  // Addiction: at least one selected
  if (Array.isArray(profile.addictions) && profile.addictions.length > 0) {
    completed.add('addiction');
  }

  // Daily spend: only after full onboarding (not persisted mid-wizard)
  if (profile.hasCompletedOnboarding) {
    completed.add('daily_spend');
  }

  // Stage: has a valid stage
  if (rp.recoveryStage && ['crisis', 'stabilize', 'rebuild', 'maintain'].includes(rp.recoveryStage)) {
    completed.add('stage');
  }

  // Calibration: struggle + sleep
  if (
    typeof rp.struggleLevel === 'number' &&
    rp.sleepQuality &&
    ['poor', 'fair', 'good', 'excellent'].includes(rp.sleepQuality)
  ) {
    completed.add('calibration');
  }

  // Triggers: at least one trigger
  if (Array.isArray(rp.triggers) && rp.triggers.length > 0) {
    completed.add('triggers');
  }

  // Goals: at least one goal
  if (Array.isArray(rp.goals) && rp.goals.length > 0) {
    completed.add('goals');
  }

  return completed;
}

/** Get remaining onboarding steps in display order */
export function getRemainingOnboardingSteps(
  profile: UserProfile,
  emergencyContacts: EmergencyContact[],
  accountabilityData: AccountabilityData | null
): OnboardingStepDef[] {
  const completed = getCompletedOnboardingSteps(profile, emergencyContacts, accountabilityData);
  return ONBOARDING_STEP_IDS.filter((id) => !completed.has(id)).map((id) => ({
    id,
    fullIndex: ONBOARDING_STEP_IDS.indexOf(id),
  }));
}

/** Map step id -> 0-based index in the *remaining* steps list */
export function getRemainingStepIndex(
  remainingSteps: OnboardingStepDef[],
  stepId: OnboardingStepId
): number {
  const i = remainingSteps.findIndex((s) => s.id === stepId);
  return i >= 0 ? i : 0;
}

/**
 * Daily guidance actions have been consolidated into utils/wizardEngine.ts.
 * This file retains only onboarding step detection used by onboarding.tsx.
 */
