/**
 * Hook that assembles all data sources and feeds them into the wizard engine.
 * Returns a reactive WizardPlan that updates automatically when underlying
 * stores change (check-in completed, pledge taken, etc.).
 */

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUser } from '@/core/domains/useUser';
import { useCheckin } from '@/core/domains/useCheckin';
import { useRebuild } from '@/core/domains/useRebuild';
import { usePledges } from '@/core/domains/usePledges';
import { useSupportContacts } from '@/core/domains/useSupportContacts';
import { useAccountability } from '@/core/domains/useAccountability';
import { useJournal } from '@/core/domains/useJournal';
import { useAppMeta } from '@/core/domains/useAppMeta';
import { useAppStore } from '@/stores/useAppStore';
import { useRiskPrediction } from '@/providers/RiskPredictionProvider';
import { useStageDetection } from '@/providers/StageDetectionProvider';
import { useEngagement } from '@/providers/EngagementProvider';
import { usePersonalization } from '@/features/home/hooks/usePersonalization';
import {
  useWizardBehaviorStore,
  useHydrateWizardBehaviorStore,
} from '@/stores/useWizardBehaviorStore';
import {
  generateWizardPlan,
  type WizardPlan,
  type WizardAction,
  type WizardEngineInput,
} from '@/utils/wizardEngine';

const EMPTY_PLAN: WizardPlan = {
  setupProgress: null,
  dailyGuidance: {
    primaryAction: null,
    actions: [],
    riskWarnings: [],
    encouragement: null,
    contextHint: null,
    isComplete: false,
    completionMessage: null,
    isReentryMode: false,
  },
};

export interface RecentCompletion {
  actionTitle: string;
  timestamp: number;
}

export interface WizardEngineResult {
  plan: WizardPlan;
  recentCompletion: RecentCompletion | null;
  clearRecentCompletion: () => void;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function useWizardEngineHook(): WizardEngineResult {
  useHydrateWizardBehaviorStore();

  const userHook = useUser();
  const profile = userHook?.profile;
  const daysSober = userHook?.daysSober ?? 0;

  const checkinHook = useCheckin();
  const todayCheckIns = checkinHook?.todayCheckIns ?? [];
  const currentCheckInPeriod = checkinHook?.currentCheckInPeriod;

  const rebuildHook = useRebuild();
  const rebuildData = rebuildHook?.rebuildData;

  const pledgesHook = usePledges();
  const todayPledge = pledgesHook?.todayPledge ?? null;

  const contactsHook = useSupportContacts();
  const emergencyContacts = contactsHook?.emergencyContacts ?? [];

  const accountabilityHook = useAccountability();
  const accountabilityData = accountabilityHook?.accountabilityData;

  const journalHook = useJournal();
  const journal = journalHook?.journal ?? [];

  const appMetaHook = useAppMeta();
  const stabilityScore = appMetaHook?.stabilityScore ?? 50;

  const centralProfile = useAppStore((s) => s.userProfile);

  const stageHook = useStageDetection();
  const currentStage = stageHook?.currentStage;
  const currentProgram = stageHook?.currentProgram;

  const riskHook = useRiskPrediction();
  const riskCategory = riskHook?.riskCategory ?? 'low' as const;
  const missedEngagement = riskHook?.missedEngagement ?? 0;
  const currentPrediction = riskHook?.currentPrediction;
  const trendLabel = riskHook?.trendLabel ?? '';

  const engagementHook = useEngagement();
  const streak = engagementHook?.streak;

  const personalization = usePersonalization();

  const behaviorState = useWizardBehaviorStore(
    useShallow((s) => ({
      actionHistory: s.actionHistory,
      periodEngagement: s.periodEngagement,
      consecutiveLowStabilityDays: s.consecutiveLowStabilityDays,
      consecutiveHighStabilityDays: s.consecutiveHighStabilityDays,
      lastSessionDate: s.lastSessionDate,
      lastStabilityUpdateDate: s.lastStabilityUpdateDate,
    })),
  );

  const getDaysSinceLastSession =
    useWizardBehaviorStore.use.getDaysSinceLastSession();
  const recordSessionStart = useWizardBehaviorStore.use.recordSessionStart();
  const recordActionSurfaced =
    useWizardBehaviorStore.use.recordActionSurfaced();
  const recordActionCompleted =
    useWizardBehaviorStore.use.recordActionCompleted();
  const updateStabilityStreak =
    useWizardBehaviorStore.use.updateStabilityStreak();

  const [recentCompletion, setRecentCompletion] =
    useState<RecentCompletion | null>(null);

  const clearRecentCompletion = useCallback(
    () => setRecentCompletion(null),
    [],
  );

  const currentPeriod = currentCheckInPeriod ?? (() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning' as const;
    if (h < 17) return 'afternoon' as const;
    return 'evening' as const;
  })();

  // Record session start on mount
  const didRecordSession = useRef(false);
  useEffect(() => {
    if (!didRecordSession.current) {
      didRecordSession.current = true;
      recordSessionStart(currentPeriod);
      updateStabilityStreak(stabilityScore);
    }
  }, [recordSessionStart, currentPeriod, updateStabilityStreak, stabilityScore]);

  const hasJournalEntryToday = useMemo(() => {
    const today = getToday();
    return (journal ?? []).some((e) => e.date === today);
  }, [journal]);

  const daysSinceLastSession = useMemo(
    () => getDaysSinceLastSession(),
    [getDaysSinceLastSession, behaviorState.lastSessionDate],
  );

  const today = getToday();
  const rebuildHabitsCompletedToday = useMemo(
    () =>
      (rebuildData?.habits ?? []).filter(
        (h) => (h as { completedDates?: string[] }).completedDates?.includes(today),
      ).length,
    [rebuildData?.habits, today],
  );

  const rebuildRoutinesCompletedToday = useMemo(
    () =>
      (rebuildData?.routines ?? []).filter(
        (r) => (r as { isCompleted?: boolean }).isCompleted,
      ).length,
    [rebuildData?.routines],
  );

  const stabilityTrend: 'rising' | 'declining' | 'stable' = useMemo(() => {
    const raw = trendLabel?.toLowerCase() ?? '';
    if (raw.includes('rising') || raw.includes('improving')) return 'rising';
    if (raw.includes('declining') || raw.includes('falling')) return 'declining';
    return 'stable';
  }, [trendLabel]);

  const safeProfile = profile ?? {} as any;

  const input: WizardEngineInput = useMemo(
    () => ({
      hasCompletedOnboarding:
        centralProfile?.hasCompletedOnboarding ?? safeProfile.hasCompletedOnboarding ?? false,
      profile: safeProfile,
      daysSober,
      hasEmergencyContacts: (emergencyContacts?.length ?? 0) > 0,
      hasRebuildConfigured:
        (rebuildData?.habits?.length ?? 0) > 0 ||
        (rebuildData?.routines?.length ?? 0) > 0 ||
        (rebuildData?.goals?.length ?? 0) > 0,
      hasAccountabilityConfigured:
        (accountabilityData?.partners?.length ?? 0) > 0 ||
        (accountabilityData?.contracts?.length ?? 0) > 0,
      hasTriggers: (safeProfile.recoveryProfile?.triggers?.length ?? 0) > 0,
      emergencyContacts: emergencyContacts ?? [],
      accountabilityData: accountabilityData ?? null,
      todayCheckIns: todayCheckIns ?? [],
      currentPeriod,
      stabilityScore: stabilityScore ?? 50,
      stabilityTrend,
      relapseRisk: riskCategory ?? 'low',
      missedEngagementScore: missedEngagement ?? 0,
      triggerRiskScore: currentPrediction?.triggerRisk ?? 0,
      recoveryStage: currentStage ?? safeProfile.recoveryProfile?.recoveryStage ?? 'crisis',
      stageProgramDay: currentProgram?.day,
      stageProgramDuration: currentProgram?.duration,
      todayPledge: todayPledge ?? null,
      hasJournalEntryToday,
      rebuildGoalsCount: rebuildData?.goals?.length ?? 0,
      rebuildHabitsCompletedToday,
      rebuildRoutinesCompletedToday,
      identityCurrentWeek: rebuildData?.identityProgram?.currentWeek ?? 0,
      highUrge: personalization?.highUrgeCrisisHint?.shouldHighlightCrisisTools ?? false,
      nightRisk: personalization?.nightRiskWarning?.shouldWarn ?? false,
      lowMood: personalization?.lowMoodSuggestions?.shouldSuggest ?? false,
      streakLength: streak?.currentStreak ?? 0,
      behaviorHistory: behaviorState,
      daysSinceLastSession,
    }),
    [
      centralProfile?.hasCompletedOnboarding,
      safeProfile,
      daysSober,
      emergencyContacts,
      rebuildData,
      accountabilityData,
      todayCheckIns,
      currentPeriod,
      stabilityScore,
      stabilityTrend,
      riskCategory,
      missedEngagement,
      currentPrediction?.triggerRisk,
      currentStage,
      currentProgram?.day,
      currentProgram?.duration,
      todayPledge,
      hasJournalEntryToday,
      rebuildHabitsCompletedToday,
      rebuildRoutinesCompletedToday,
      personalization,
      streak?.currentStreak,
      behaviorState,
      daysSinceLastSession,
    ],
  );

  const plan = useMemo(() => {
    try {
      return generateWizardPlan(input);
    } catch (err) {
      console.error('[WizardEngine] generateWizardPlan threw:', err);
      return EMPTY_PLAN;
    }
  }, [input]);

  // Record surfaced actions
  const surfacedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const action of plan.dailyGuidance.actions) {
      if (!action.completed && !surfacedRef.current.has(action.id)) {
        surfacedRef.current.add(action.id);
        recordActionSurfaced(action.id);
      }
    }
  }, [plan.dailyGuidance.actions, recordActionSurfaced]);

  // Detect completions for feedback toast and behavioral tracking
  const prevActionsRef = useRef<Map<string, boolean>>(new Map());
  useEffect(() => {
    const prev = prevActionsRef.current;
    for (const action of plan.dailyGuidance.actions) {
      const wasPreviouslyIncomplete = prev.has(action.id) && !prev.get(action.id);
      if (action.completed && wasPreviouslyIncomplete) {
        recordActionCompleted(action.id);
        setRecentCompletion({
          actionTitle: action.title,
          timestamp: Date.now(),
        });
      }
    }
    const next = new Map<string, boolean>();
    for (const action of plan.dailyGuidance.actions) {
      next.set(action.id, action.completed);
    }
    prevActionsRef.current = next;
  }, [plan.dailyGuidance.actions, recordActionCompleted]);

  return { plan, recentCompletion, clearRecentCompletion };
}
