import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RetentionLoop,
  RetentionLoopType,
  RetentionData,
  MicroProgressMarker,
  MicroProgressCategory,
  EmotionalRegulationStreak,
  TriggerReductionMilestone,
  ConfidenceGrowthMarker,
  SupportiveNotification,
  DailyCheckIn,
} from '@/types';
import {
  RETENTION_LOOPS,
  MICRO_PROGRESS_DEFINITIONS,
  TRIGGER_REDUCTION_MILESTONES,
  BEHAVIORAL_NOTIFICATION_TEMPLATES,
} from '@/constants/retention';

const STORAGE_KEY = 'retention_data';

const DEFAULT_EMOTIONAL_REGULATION: EmotionalRegulationStreak = {
  currentStreak: 0,
  bestStreak: 0,
  lastStableDate: '',
  volatilityScores: [],
};

const DEFAULT_LOOPS: RetentionLoop[] = RETENTION_LOOPS.map(l => ({
  id: l.id,
  label: l.label,
  description: l.description,
  score: 0,
  previousScore: 0,
  activatedAt: '',
  lastTriggeredAt: '',
  triggerCount: 0,
}));

const DEFAULT_RETENTION: RetentionData = {
  loops: DEFAULT_LOOPS,
  microProgress: [],
  emotionalRegulation: DEFAULT_EMOTIONAL_REGULATION,
  triggerMilestones: [],
  confidenceMarkers: [],
  notifications: [],
  overallRetentionScore: 0,
  lastEvaluatedAt: '',
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateMoodVolatility(moods: number[]): number {
  if (moods.length < 2) return 0;
  let totalDelta = 0;
  for (let i = 1; i < moods.length; i++) {
    totalDelta += Math.abs(moods[i] - moods[i - 1]);
  }
  return totalDelta / (moods.length - 1);
}

function isEmotionallyStable(volatility: number): boolean {
  return volatility <= 18;
}

/** Deep enough clone so batched retention evaluators can mutate without stale overwrites. */
function cloneRetentionForMerge(retention: RetentionData): RetentionData {
  return {
    ...retention,
    loops: retention.loops.map((l) => ({ ...l })),
    microProgress: retention.microProgress.map((m) => ({ ...m })),
    emotionalRegulation: {
      ...retention.emotionalRegulation,
      volatilityScores: [...retention.emotionalRegulation.volatilityScores],
    },
    triggerMilestones: retention.triggerMilestones.map((m) => ({ ...m })),
    confidenceMarkers: retention.confidenceMarkers.map((m) => ({ ...m })),
    notifications: [...retention.notifications],
  };
}

function applyEmotionalRegulationToState(r: RetentionData, checkIns: DailyCheckIn[]): RetentionData {
  if (checkIns.length < 2) return r;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const recentMoods = sorted.slice(0, 7).map((c) => c.mood);
  const volatility = calculateMoodVolatility(recentMoods);
  const stable = isEmotionallyStable(volatility);
  const today = getToday();

  const reg = { ...r.emotionalRegulation };
  const newVolatilityScores = [volatility, ...reg.volatilityScores].slice(0, 30);

  if (stable) {
    if (reg.lastStableDate === '') {
      reg.currentStreak = 1;
    } else {
      const lastDate = new Date(reg.lastStableDate);
      const todayDate = new Date(today);
      const dayDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
      if (dayDiff <= 1) {
        reg.currentStreak += 1;
      } else if (dayDiff > 2) {
        reg.currentStreak = 1;
      }
    }
    reg.lastStableDate = today;
    reg.bestStreak = Math.max(reg.bestStreak, reg.currentStreak);
  } else {
    reg.currentStreak = 0;
  }
  reg.volatilityScores = newVolatilityScores;

  const microProgress = [...r.microProgress];
  const existingEmotionalMarker = microProgress.find((m) => m.category === 'emotional_regulation');
  if (existingEmotionalMarker) {
    existingEmotionalMarker.currentValue = reg.currentStreak;
    existingEmotionalMarker.streakDays = reg.currentStreak;
    existingEmotionalMarker.bestStreak = reg.bestStreak;
    existingEmotionalMarker.trend = stable ? 'improving' : volatility > 25 ? 'declining' : 'stable';
    existingEmotionalMarker.earnedAt = new Date().toISOString();
  } else {
    microProgress.push({
      id: 'emotional_regulation_tracker',
      category: 'emotional_regulation',
      title: 'Emotional Regulation',
      description: 'Days with stable mood patterns',
      currentValue: reg.currentStreak,
      targetValue: 30,
      unit: 'stable days',
      earnedAt: new Date().toISOString(),
      streakDays: reg.currentStreak,
      bestStreak: reg.bestStreak,
      trend: stable ? 'improving' : 'stable',
    });
  }

  return {
    ...r,
    emotionalRegulation: reg,
    microProgress,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

function applyTriggerReductionToState(r: RetentionData, checkIns: DailyCheckIn[]): RetentionData {
  if (checkIns.length < 5) return r;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const recent = sorted.slice(0, 7);
  const baseline = sorted.slice(-7);

  const recentAvg = recent.reduce((s, c) => s + c.cravingLevel, 0) / recent.length;
  const baselineAvg = baseline.reduce((s, c) => s + c.cravingLevel, 0) / baseline.length;

  const reductionPct =
    baselineAvg > 0 ? Math.round(((baselineAvg - recentAvg) / baselineAvg) * 100) : 0;

  const currentReduction = Math.max(0, reductionPct);

  const existingMilestones = r.triggerMilestones.map((m) => m.threshold);
  const newMilestones: TriggerReductionMilestone[] = [...r.triggerMilestones];

  for (const tm of TRIGGER_REDUCTION_MILESTONES) {
    if (currentReduction >= tm.threshold && !existingMilestones.includes(tm.threshold)) {
      newMilestones.push({
        id: `trigger_reduction_${tm.threshold}`,
        title: tm.title,
        description: tm.description,
        threshold: tm.threshold,
        achievedAt: new Date().toISOString(),
        currentReduction,
      });
      console.log('[Retention] Trigger reduction milestone:', tm.title);
    }
  }

  const microProgress = [...r.microProgress];
  const existingTriggerMarker = microProgress.find((m) => m.category === 'trigger_reduction');
  if (existingTriggerMarker) {
    existingTriggerMarker.currentValue = currentReduction;
    existingTriggerMarker.trend =
      recentAvg < baselineAvg ? 'improving' : recentAvg > baselineAvg ? 'declining' : 'stable';
    existingTriggerMarker.earnedAt = new Date().toISOString();
  } else {
    microProgress.push({
      id: 'trigger_reduction_tracker',
      category: 'trigger_reduction',
      title: 'Trigger Reduction',
      description: 'Decrease in craving intensity',
      currentValue: currentReduction,
      targetValue: 70,
      unit: '% reduction',
      earnedAt: new Date().toISOString(),
      streakDays: 0,
      bestStreak: 0,
      trend: currentReduction > 0 ? 'improving' : 'stable',
    });
  }

  return {
    ...r,
    triggerMilestones: newMilestones,
    microProgress,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

function applyConfidenceGrowthToState(
  r: RetentionData,
  daysSober: number,
  checkIns: DailyCheckIn[],
  journalCount: number,
  pledgeStreak: number,
  communityInteractions: number,
): RetentionData {
  const factors: string[] = [];
  let score = 0;

  const soberBonus = Math.min(daysSober / 90, 1) * 25;
  score += soberBonus;
  if (daysSober >= 7) factors.push('consecutive_sober_days');

  const checkInRate = checkIns.length > 0 ? Math.min(checkIns.length / 14, 1) * 20 : 0;
  score += checkInRate;
  if (checkIns.length >= 7) factors.push('completed_check_ins');

  if (checkIns.length >= 3) {
    const sorted = [...checkIns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const recentCravings = sorted.slice(0, 5);
    const highCravingManaged = recentCravings.filter((c) => c.cravingLevel > 60).length;
    const managementScore = Math.min(highCravingManaged / 3, 1) * 15;
    score += managementScore;
    if (highCravingManaged > 0) factors.push('managed_high_craving');
  }

  const journalBonus = Math.min(journalCount / 10, 1) * 15;
  score += journalBonus;
  if (journalCount >= 3) factors.push('journal_reflections');

  const pledgeBonus = Math.min(pledgeStreak / 7, 1) * 15;
  score += pledgeBonus;
  if (pledgeStreak >= 3) factors.push('routine_adherence');

  const connectionBonus = Math.min(communityInteractions / 5, 1) * 10;
  score += connectionBonus;
  if (communityInteractions >= 2) factors.push('community_connections');

  const finalScore = Math.round(Math.min(100, score));

  const markers = [...r.confidenceMarkers];
  const latest = markers.length > 0 ? markers[markers.length - 1] : null;
  const previousScore = latest?.score ?? 0;

  const today = getToday();
  const alreadyMeasuredToday = latest?.measuredAt.startsWith(today);

  if (!alreadyMeasuredToday) {
    markers.push({
      id: `confidence_${Date.now()}`,
      title:
        finalScore >= 80
          ? 'Deep Confidence'
          : finalScore >= 60
            ? 'Growing Trust'
            : finalScore >= 40
              ? 'Building Belief'
              : 'Planting Seeds',
      description:
        finalScore >= 60
          ? "You're developing real faith in your ability to recover."
          : 'Every small step is building your inner trust.',
      score: finalScore,
      previousScore,
      measuredAt: new Date().toISOString(),
      factors,
    });
  } else if (latest) {
    latest.score = finalScore;
    latest.factors = factors;
  }

  const microProgress = [...r.microProgress];
  const existingConfidenceMarker = microProgress.find((m) => m.category === 'confidence_growth');
  if (existingConfidenceMarker) {
    existingConfidenceMarker.currentValue = finalScore;
    existingConfidenceMarker.trend =
      finalScore > previousScore ? 'improving' : finalScore < previousScore ? 'declining' : 'stable';
    existingConfidenceMarker.earnedAt = new Date().toISOString();
  } else {
    microProgress.push({
      id: 'confidence_growth_tracker',
      category: 'confidence_growth',
      title: 'Confidence Growth',
      description: 'Trust in your recovery ability',
      currentValue: finalScore,
      targetValue: 95,
      unit: 'confidence score',
      earnedAt: new Date().toISOString(),
      streakDays: 0,
      bestStreak: 0,
      trend: finalScore > 0 ? 'improving' : 'stable',
    });
  }

  return {
    ...r,
    confidenceMarkers: markers.slice(-30),
    microProgress,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

function applyConsistencyToState(r: RetentionData, checkIns: DailyCheckIn[]): RetentionData {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  let consistencyStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const checkDate = new Date(sorted[i].date);
    checkDate.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === expected.getTime()) {
      consistencyStreak++;
    } else {
      break;
    }
  }

  const microProgress = [...r.microProgress];
  const existingConsistencyMarker = microProgress.find((m) => m.category === 'consistency');
  if (existingConsistencyMarker) {
    existingConsistencyMarker.currentValue = consistencyStreak;
    existingConsistencyMarker.streakDays = consistencyStreak;
    existingConsistencyMarker.bestStreak = Math.max(
      existingConsistencyMarker.bestStreak,
      consistencyStreak,
    );
    existingConsistencyMarker.trend = consistencyStreak > 0 ? 'improving' : 'stable';
    existingConsistencyMarker.earnedAt = new Date().toISOString();
  } else {
    microProgress.push({
      id: 'consistency_tracker',
      category: 'consistency',
      title: 'Consistency',
      description: 'Showing up for recovery daily',
      currentValue: consistencyStreak,
      targetValue: 90,
      unit: 'day streak',
      earnedAt: new Date().toISOString(),
      streakDays: consistencyStreak,
      bestStreak: consistencyStreak,
      trend: consistencyStreak > 0 ? 'improving' : 'stable',
    });
  }

  return {
    ...r,
    microProgress,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

function applyOverallRetentionScoreToState(r: RetentionData): RetentionData {
  const loopScoreAvg =
    r.loops.reduce((s, l) => s + l.score, 0) / Math.max(r.loops.length, 1);

  const progressScores = r.microProgress.map((m) =>
    m.targetValue > 0 ? (m.currentValue / m.targetValue) * 100 : 0,
  );
  const progressAvg =
    progressScores.length > 0
      ? progressScores.reduce((s, v) => s + v, 0) / progressScores.length
      : 0;

  const overallRetentionScore = Math.round(loopScoreAvg * 0.4 + progressAvg * 0.6);
  return {
    ...r,
    overallRetentionScore,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

export const [RetentionProvider, useRetention] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [retention, setRetention] = useState<RetentionData>(DEFAULT_RETENTION);

  const retentionQuery = useQuery({
    queryKey: ['retention'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RetentionData;
          return {
            ...DEFAULT_RETENTION,
            ...parsed,
            loops: parsed.loops?.length > 0 ? parsed.loops : DEFAULT_LOOPS,
            emotionalRegulation: {
              ...DEFAULT_EMOTIONAL_REGULATION,
              ...(parsed.emotionalRegulation ?? {}),
            },
          };
        }
        return DEFAULT_RETENTION;
      } catch (e) {
        console.log('[Retention] Error loading data:', e);
        return DEFAULT_RETENTION;
      }
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (retentionQuery.data) {
      setRetention(retentionQuery.data);
    }
  }, [retentionQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (data: RetentionData) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      setRetention(data);
      queryClient.setQueryData(['retention'], data);
    },
  });

  const save = useCallback((data: RetentionData) => {
    setRetention(data);
    saveMutation.mutate(data);
  }, []);

  const triggerLoop = useCallback((loopType: RetentionLoopType, trigger: string) => {
    console.log('[Retention] Triggering loop:', loopType, 'via:', trigger);
    const now = new Date().toISOString();
    const loops = retention.loops.map(l => {
      if (l.id !== loopType) return l;
      const newScore = Math.min(100, l.score + 3);
      return {
        ...l,
        score: newScore,
        previousScore: l.score,
        lastTriggeredAt: now,
        triggerCount: l.triggerCount + 1,
        activatedAt: l.activatedAt || now,
      };
    });

    const loopDef = RETENTION_LOOPS.find(l => l.id === loopType);
    const message = loopDef
      ? loopDef.reinforcementMessages[Math.floor(Math.random() * loopDef.reinforcementMessages.length)]
      : '';

    if (message) {
      console.log('[Retention] Reinforcement:', message);
    }

    const updated = { ...retention, loops, lastEvaluatedAt: now };
    save(updated);
    return message;
  }, [retention, save]);

  const evaluateEmotionalRegulation = useCallback(
    (checkIns: DailyCheckIn[]) => {
      const next = applyEmotionalRegulationToState(retention, checkIns);
      if (next !== retention) save(next);
    },
    [retention, save],
  );

  const evaluateTriggerReduction = useCallback(
    (checkIns: DailyCheckIn[]) => {
      const next = applyTriggerReductionToState(retention, checkIns);
      if (next !== retention) save(next);
    },
    [retention, save],
  );

  const evaluateConfidenceGrowth = useCallback(
    (
      daysSober: number,
      checkIns: DailyCheckIn[],
      journalCount: number,
      pledgeStreak: number,
      communityInteractions: number,
    ) => {
      const next = applyConfidenceGrowthToState(
        retention,
        daysSober,
        checkIns,
        journalCount,
        pledgeStreak,
        communityInteractions,
      );
      save(next);
    },
    [retention, save],
  );

  const evaluateConsistency = useCallback(
    (checkIns: DailyCheckIn[], _pledgeStreak: number) => {
      const next = applyConsistencyToState(retention, checkIns);
      save(next);
    },
    [retention, save],
  );

  const generateSupportiveNotification = useCallback((
    pattern: string,
    checkIns: DailyCheckIn[],
  ): SupportiveNotification | null => {
    const template = BEHAVIORAL_NOTIFICATION_TEMPLATES.find(t => t.pattern === pattern);
    if (!template) return null;

    const today = getToday();
    const alreadySent = retention.notifications.some(
      n => n.behaviorPattern === pattern && n.scheduledFor.startsWith(today)
    );
    if (alreadySent) return null;

    const message = template.messages[Math.floor(Math.random() * template.messages.length)];

    const notification: SupportiveNotification = {
      id: `notif_${Date.now()}`,
      type: template.type,
      title: template.title,
      message,
      scheduledFor: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
      behaviorPattern: pattern,
      isDelivered: true,
    };

    const notifications = [notification, ...retention.notifications].slice(0, 50);
    const updated = { ...retention, notifications };
    save(updated);

    console.log('[Retention] Notification generated:', template.title, '-', message);
    return notification;
  }, [retention, save]);

  const evaluateRetentionScore = useCallback(() => {
    save(applyOverallRetentionScoreToState(retention));
  }, [retention, save]);

  const runFullEvaluation = useCallback(
    (
      checkIns: DailyCheckIn[],
      daysSober: number,
      journalCount: number,
      pledgeStreak: number,
      communityInteractions: number,
    ) => {
      console.log('[Retention] Running full evaluation...');
      let r = cloneRetentionForMerge(retention);
      r = applyEmotionalRegulationToState(r, checkIns);
      r = applyTriggerReductionToState(r, checkIns);
      r = applyConfidenceGrowthToState(
        r,
        daysSober,
        checkIns,
        journalCount,
        pledgeStreak,
        communityInteractions,
      );
      r = applyConsistencyToState(r, checkIns);
      r = applyOverallRetentionScoreToState(r);
      save(r);
    },
    [retention, save],
  );

  const getLoopMessage = useCallback((loopType: RetentionLoopType): string => {
    const loopDef = RETENTION_LOOPS.find(l => l.id === loopType);
    if (!loopDef) return '';
    return loopDef.reinforcementMessages[Math.floor(Math.random() * loopDef.reinforcementMessages.length)];
  }, []);

  const activeLoops = useMemo(() => {
    return retention.loops.filter(l => l.score > 0).sort((a, b) => b.score - a.score);
  }, [retention.loops]);

  const topMicroProgress = useMemo(() => {
    return [...retention.microProgress]
      .sort((a, b) => {
        const aPct = a.targetValue > 0 ? a.currentValue / a.targetValue : 0;
        const bPct = b.targetValue > 0 ? b.currentValue / b.targetValue : 0;
        return bPct - aPct;
      });
  }, [retention.microProgress]);

  const recentNotifications = useMemo(() => {
    return retention.notifications.slice(0, 10);
  }, [retention.notifications]);

  const latestConfidence = useMemo(() => {
    return retention.confidenceMarkers.length > 0
      ? retention.confidenceMarkers[retention.confidenceMarkers.length - 1]
      : null;
  }, [retention.confidenceMarkers]);

  return useMemo(() => ({
    retention,
    loops: retention.loops,
    microProgress: retention.microProgress,
    emotionalRegulation: retention.emotionalRegulation,
    triggerMilestones: retention.triggerMilestones,
    confidenceMarkers: retention.confidenceMarkers,
    overallRetentionScore: retention.overallRetentionScore,
    activeLoops,
    topMicroProgress,
    recentNotifications,
    latestConfidence,
    triggerLoop,
    evaluateEmotionalRegulation,
    evaluateTriggerReduction,
    evaluateConfidenceGrowth,
    evaluateConsistency,
    evaluateRetentionScore,
    runFullEvaluation,
    generateSupportiveNotification,
    getLoopMessage,
    isLoading: retentionQuery.isLoading,
  }), [
    retention, activeLoops, topMicroProgress, recentNotifications,
    latestConfidence, triggerLoop, evaluateEmotionalRegulation,
    evaluateTriggerReduction, evaluateConfidenceGrowth,
    evaluateConsistency, evaluateRetentionScore,
    runFullEvaluation, generateSupportiveNotification,
    getLoopMessage, retentionQuery.isLoading,
  ]);
});
