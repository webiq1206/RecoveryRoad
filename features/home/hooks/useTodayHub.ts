/**
 * View-model hook for the Today Hub screen.
 * Provides stability, risk, and loading state.
 * Daily guidance is now handled by hooks/useWizardEngine.ts.
 */

import { useMemo } from 'react';
import { useRiskPrediction } from '@/providers/RiskPredictionProvider';
import { useUser } from '@/core/domains/useUser';
import { useCheckin } from '@/core/domains/useCheckin';
import { useAppStore } from '@/stores/useAppStore';
import { calculateStability } from '@/utils/stabilityEngine';
import type { StabilityZoneId } from '@/components/RecoveryStabilityPanel';
import type { StabilityTrend } from '@/utils/stabilityEngine';

export interface TodayHubViewModel {
  isLoading: boolean;
  shouldRedirectToOnboarding: boolean;
  stability: {
    score: number;
    trend: StabilityTrend;
    zoneId: StabilityZoneId;
  };
  relapseRisk: {
    category: 'low' | 'guarded' | 'elevated' | 'high';
    label: string;
    trendLabel: string;
  };
  showRelapsePlanCta: boolean;
}

function getStabilityZoneId(score: number): StabilityZoneId {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 30) return 'orange';
  return 'red';
}

export function useTodayHub(): TodayHubViewModel {
  const { profile, isLoading } = useUser();
  const { checkIns } = useCheckin();
  const centralProfile = useAppStore((s) => s.userProfile);
  const centralDailyCheckIns = useAppStore((s) => s.dailyCheckIns);
  const {
    riskCategory,
    riskLabel,
    trendLabel: riskTrendLabel,
  } = useRiskPrediction();

  const stabilityResult = useMemo(() => {
    const rp = (centralProfile ?? profile).recoveryProfile;
    const sourceCheckIns = centralDailyCheckIns.length > 0 ? centralDailyCheckIns : checkIns;
    const sorted = [...sourceCheckIns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const previousScores = sorted.slice(0, 7).map((c) => c.stabilityScore);
    const today = new Date().toISOString().split('T')[0];
    const dailyActionsCompleted = sourceCheckIns.filter((c) => c.date === today).length;

    const sleepQuality: 'poor' | 'okay' | 'good' =
      rp.sleepQuality === 'fair'
        ? 'okay'
        : rp.sleepQuality === 'excellent'
          ? 'good'
          : rp.sleepQuality === 'poor'
            ? 'poor'
            : 'good';

    const input = {
      intensity: rp.struggleLevel,
      sleepQuality,
      triggers: rp.triggers ?? [],
      supportLevel: rp.supportAvailability,
      dailyActionsCompleted,
      relapseLogged: (rp.relapseCount ?? 0) > 0,
    };

    return calculateStability(input, previousScores);
  }, [centralProfile, centralDailyCheckIns, profile.recoveryProfile, checkIns]);

  return useMemo(
    () => ({
      isLoading,
      shouldRedirectToOnboarding: !profile.hasCompletedOnboarding,
      stability: {
        score: stabilityResult.score,
        trend: stabilityResult.trend,
        zoneId: getStabilityZoneId(stabilityResult.score),
      },
      relapseRisk: {
        category: riskCategory,
        label: riskLabel,
        trendLabel: riskTrendLabel || 'Stable',
      },
      showRelapsePlanCta: riskCategory === 'high',
    }),
    [
      isLoading,
      profile.hasCompletedOnboarding,
      stabilityResult.score,
      stabilityResult.trend,
      riskCategory,
      riskLabel,
      riskTrendLabel,
    ]
  );
}
