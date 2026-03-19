/**
 * Adaptive wizard: Onboarding (remaining setup steps) and Daily Guidance (prioritized actions).
 * Detects completed integrations/settings and only recommends what's left.
 */

import type { UserProfile, RecoveryProfile, EmergencyContact } from '@/types';
import type { AccountabilityData } from '@/types';
import type { DailyCheckIn } from '@/types';
import type { Pledge } from '@/types';

// ---- Onboarding step IDs (match order used in onboarding.tsx) ----
export const ONBOARDING_STEP_IDS = [
  'identity',
  'addiction',
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

// ---- Daily Guidance (existing users): prioritized actions for today ----

export type DailyActionId =
  | 'checkin_morning'
  | 'checkin_afternoon'
  | 'checkin_evening'
  | 'pledge'
  | 'emergency_contact'
  | 'trigger_review'
  | 'rebuild_action'
  | 'journal'
  | 'crisis_tools'
  | 'accountability'
  | 'identity_module';

export interface DailyAction {
  id: DailyActionId;
  title: string;
  subtitle: string;
  route: string;
  priority: number;
  reason?: string;
  completed: boolean;
}

export interface DailyGuidanceInput {
  profile: UserProfile;
  todayCheckIns: DailyCheckIn[];
  todayPledge: Pledge | null;
  emergencyContacts: EmergencyContact[];
  accountabilityData: AccountabilityData | null;
  stabilityScore: number;
  currentCheckInPeriod: 'morning' | 'afternoon' | 'evening';
  hasJournalEntryToday: boolean;
  rebuildGoalsCount: number;
  identityCurrentWeek: number;
}

/** Build a prioritized list of recommended actions for today */
export function getDailyGuidanceActions(input: DailyGuidanceInput): DailyAction[] {
  const {
    todayCheckIns,
    todayPledge,
    emergencyContacts,
    accountabilityData,
    stabilityScore,
    currentCheckInPeriod,
    hasJournalEntryToday,
    rebuildGoalsCount,
  } = input;

  const actions: DailyAction[] = [];

  // Current period check-in
  const hasCurrentCheckIn = todayCheckIns.some((c) => c.timeOfDay === currentCheckInPeriod);
  const periodLabel =
    currentCheckInPeriod === 'morning'
      ? 'Morning'
      : currentCheckInPeriod === 'afternoon'
        ? 'Afternoon'
        : 'Evening';
  actions.push({
    id: `checkin_${currentCheckInPeriod}` as DailyActionId,
    title: `${periodLabel} Check-In`,
    subtitle: "Set how you're arriving and one gentle intention.",
    route: '/daily-checkin',
    priority: hasCurrentCheckIn ? 0 : 100,
    completed: hasCurrentCheckIn,
  });

  // Today's pledge
  actions.push({
    id: 'pledge',
    title: "Today's Pledge",
    subtitle: 'Commit to today and track your intention.',
    route: '/rebuild',
    priority: todayPledge?.completed ? 0 : 90,
    completed: !!todayPledge?.completed,
  });

  // Emergency contact
  const hasEmergencyContact = emergencyContacts.length > 0;
  actions.push({
    id: 'emergency_contact',
    title: 'Add Emergency Contact',
    subtitle: 'Someone to reach in a crisis. Stored only on your device.',
    route: '/profile',
    priority: hasEmergencyContact ? 0 : 85,
    completed: hasEmergencyContact,
  });

  // Trigger review
  const triggerPriority = stabilityScore < 50 ? 80 : 55;
  actions.push({
    id: 'trigger_review',
    title: 'Trigger Review',
    subtitle: 'Plan around one situation today.',
    route: '/triggers',
    priority: triggerPriority,
    reason: stabilityScore < 50 ? 'Your stability is low — planning helps.' : undefined,
    completed: false,
  });

  // Rebuild action
  actions.push({
    id: 'rebuild_action',
    title: 'One Rebuild Action',
    subtitle: 'One small action toward your goal.',
    route: '/rebuild',
    priority: rebuildGoalsCount > 0 ? 70 : 50,
    completed: false,
  });

  // Journal
  actions.push({
    id: 'journal',
    title: 'Journal',
    subtitle: 'Reflect and strengthen your mindset.',
    route: '/journal',
    priority: hasJournalEntryToday ? 0 : 60,
    completed: hasJournalEntryToday,
  });

  // Crisis tools when stability low
  if (stabilityScore < 40) {
    actions.push({
      id: 'crisis_tools',
      title: 'Crisis Mode',
      subtitle: 'Quick access to safety tools and support.',
      route: '/crisis-mode',
      priority: 95,
      reason: 'Extra support may help today.',
      completed: false,
    });
  }

  // Accountability
  const hasActiveContract =
    accountabilityData?.contracts?.some((c) => (c as { isActive?: boolean }).isActive !== false) ?? false;
  if (hasActiveContract) {
    actions.push({
      id: 'accountability',
      title: 'Accountability Check-In',
      subtitle: 'Check in with your commitment.',
      route: '/accountability',
      priority: 75,
      completed: false,
    });
  }

  const sorted = [...actions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.priority - a.priority;
  });

  return sorted;
}
