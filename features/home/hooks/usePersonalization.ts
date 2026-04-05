import { useMemo } from 'react';
import { useCheckin } from '../../../core/domains/useCheckin';
import { useRiskPrediction } from '../../../providers/RiskPredictionProvider';

export interface PersonalizationResult {
  /**
   * When true, the UI should strongly foreground crisis tools.
   * Example: highlight or repeat crisis entry, or show an urge-specific banner.
   */
  highUrgeCrisisHint: {
    shouldHighlightCrisisTools: boolean;
    message: string | null;
  };
  /**
   * Night-time risk warnings based on relapse patterns and current time.
   */
  nightRiskWarning: {
    shouldWarn: boolean;
    message: string | null;
  };
  /**
   * Gentle, very small actions when mood is low.
   */
  lowMoodSuggestions: {
    shouldSuggest: boolean;
    suggestions: string[];
  };
}

export function usePersonalization(): PersonalizationResult {
  const { todayCheckIn, checkIns } = useCheckin();
  const { riskCategory, currentPrediction } = useRiskPrediction();

  return useMemo<PersonalizationResult>(() => {
    const now = new Date();
    const hour = now.getHours();

    const mood = typeof todayCheckIn?.mood === 'number' ? todayCheckIn.mood : null;
    const craving =
      typeof todayCheckIn?.cravingLevel === 'number' ? todayCheckIn.cravingLevel : null;

    const hasHighUrge = craving !== null && craving >= 70;
    const hasLowMood = mood !== null && mood <= 40;

    const isNight = hour >= 21 || hour <= 5;
    const relapseRiskScore = currentPrediction?.overallRisk ?? 0;

    const hasNightRelapsePattern =
      isNight &&
      (riskCategory === 'high' ||
        riskCategory === 'elevated' ||
        relapseRiskScore >= 70);

    const recentRelapseCheckIns = checkIns
      .filter((c) => c.relapseLogged)
      .slice(0, 5);
    const hadRecentRelapse = recentRelapseCheckIns.length > 0;

    const highUrgeCrisisHint: PersonalizationResult['highUrgeCrisisHint'] = {
      shouldHighlightCrisisTools: !!hasHighUrge,
      message: hasHighUrge
        ? 'Your urge level is high today. Jump into crisis tools or your relapse plan before things escalate.'
        : null,
    };

    const nightRiskWarning: PersonalizationResult['nightRiskWarning'] = {
      shouldWarn: hasNightRelapsePattern || (isNight && hadRecentRelapse),
      message:
        hasNightRelapsePattern || (isNight && hadRecentRelapse)
          ? 'Evenings have been a higher‑risk time for you. Before scrolling or isolating, open your relapse plan or a grounding tool.'
          : null,
    };

    const lowMoodSuggestions: PersonalizationResult['lowMoodSuggestions'] = {
      shouldSuggest: !!hasLowMood,
      suggestions: hasLowMood
        ? [
            'Do a 2‑minute grounding check‑in.',
            'Send a quick message to someone safe.',
            'Step outside or change rooms for 60 seconds.',
          ]
        : [],
    };

    return {
      highUrgeCrisisHint,
      nightRiskWarning,
      lowMoodSuggestions,
    };
  }, [todayCheckIn, checkIns, riskCategory, currentPrediction]);
}

