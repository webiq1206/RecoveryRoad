/**
 * Central Stability Engine — single source of truth for all stability scoring logic.
 * Do not duplicate scoring logic in screens or providers.
 */

export type StabilityStatus =
  | 'Extra support'
  | 'Guarded'
  | 'Strengthening'
  | 'Stable';

export type StabilityTrend = 'rising' | 'stable' | 'declining';

export type MomentumLevel =
  | 'Rebuilding'
  | 'Stabilizing'
  | 'Strengthening'
  | 'Advancing';

export type StabilityInput = {
  intensity?: number; // 1–5
  sleepQuality?: 'poor' | 'okay' | 'good';
  triggers?: string[];
  supportLevel?: 'none' | 'limited' | 'moderate' | 'strong';
  dailyActionsCompleted?: number;
  relapseLogged?: boolean;
};

export type StabilityResult = {
  score: number; // 0–100
  status: StabilityStatus;
  trend: StabilityTrend;
  changeFromYesterday: number;
  momentumScore: number;
  momentumLevel: MomentumLevel;
  drivers: {
    positive: string[];
    negative: string[];
  };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Risk weights: higher = lower stability score
const SLEEP_RISK: Record<string, number> = {
  poor: 22,
  okay: 10,
  good: 0,
};

const SUPPORT_RISK: Record<string, number> = {
  none: 20,
  limited: 12,
  moderate: 5,
  strong: 0,
};

function getStatus(score: number): StabilityStatus {
  if (score < 40) return 'Extra support';
  if (score < 60) return 'Guarded';
  if (score < 80) return 'Strengthening';
  return 'Stable';
}

function getTrend(previousScores: number[]): StabilityTrend {
  if (!Array.isArray(previousScores) || previousScores.length < 6) return 'stable';
  const last3 = previousScores.slice(0, 3);
  const prev3 = previousScores.slice(3, 6);
  const last3Avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const prev3Avg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
  const diff = last3Avg - prev3Avg;
  if (diff > 2) return 'rising';
  if (diff < -2) return 'declining';
  return 'stable';
}

function getMomentum(
  score: number,
  previousScores: number[],
  dailyActionsCompleted: number
): { momentumScore: number; momentumLevel: MomentumLevel } {
  let momentumScore = 50;
  if (Array.isArray(previousScores) && previousScores.length >= 7) {
    const recent = previousScores.slice(0, 7);
    const firstHalf = recent.slice(-4).reduce((a, b) => a + b, 0) / 4;
    const secondHalf = recent.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const slope = secondHalf - firstHalf;
    momentumScore = clamp(50 + slope * 2, 0, 100);
  }
  const actionBonus = clamp((dailyActionsCompleted ?? 0) * 8, 0, 30);
  momentumScore = clamp(momentumScore + actionBonus, 0, 100);
  if (momentumScore < 25) return { momentumScore, momentumLevel: 'Rebuilding' };
  if (momentumScore < 50) return { momentumScore, momentumLevel: 'Stabilizing' };
  if (momentumScore < 75) return { momentumScore, momentumLevel: 'Strengthening' };
  return { momentumScore, momentumLevel: 'Advancing' };
}

function buildDrivers(
  data: StabilityInput,
  score: number,
  status: StabilityStatus
): { positive: string[]; negative: string[] } {
  const positive: string[] = [];
  const negative: string[] = [];
  const intensity = typeof data.intensity === 'number' && !Number.isNaN(data.intensity) ? data.intensity : 3;
  if (intensity <= 2) positive.push('Low intensity');
  else if (intensity >= 4) negative.push('High intensity');
  const sleep = data.sleepQuality ?? 'okay';
  if (sleep === 'good') positive.push('Good sleep');
  else if (sleep === 'poor') negative.push('Poor sleep');
  const triggerCount = Array.isArray(data.triggers) ? data.triggers.length : 0;
  if (triggerCount > 5) negative.push('Many triggers');
  else if (triggerCount <= 2) positive.push('Few triggers');
  const support = data.supportLevel ?? 'limited';
  if (support === 'strong' || support === 'moderate') positive.push('Support network');
  else if (support === 'none') negative.push('No support');
  const actions = data.dailyActionsCompleted ?? 0;
  if (actions >= 3) positive.push('Daily actions completed');
  if (data.relapseLogged === true) negative.push('Stability dip');
  if (score >= 60) positive.push('Stability improving');
  if (status === 'Extra support') negative.push('Extra support needed');
  return { positive, negative };
}

/**
 * Calculate stability from input data and optional previous scores (most recent first).
 * Never throws; uses safe defaults for missing fields. Score clamped 0–100.
 */
export function calculateStability(
  data: StabilityInput,
  previousScores?: number[]
): StabilityResult {
  const safeIntensity = clamp(
    typeof data.intensity === 'number' && !Number.isNaN(data.intensity) ? data.intensity : 3,
    1,
    5
  );
  const sleepQuality = data.sleepQuality ?? 'okay';
  const sleepRisk = SLEEP_RISK[sleepQuality] ?? 10;
  const triggerCount = Array.isArray(data.triggers) ? data.triggers.length : 0;
  const triggerRisk = Math.min(triggerCount * 3, 30);
  const supportLevel = data.supportLevel ?? 'limited';
  const supportRisk = SUPPORT_RISK[supportLevel] ?? 10;
  const dailyActionsCompleted = typeof data.dailyActionsCompleted === 'number' && !Number.isNaN(data.dailyActionsCompleted)
    ? Math.max(0, data.dailyActionsCompleted)
    : 0;
  const relapseLogged = data.relapseLogged === true;

  let riskPoints = 0;
  riskPoints += ((safeIntensity - 1) / 4) * 25;
  riskPoints += sleepRisk;
  riskPoints += triggerRisk;
  riskPoints += supportRisk;
  if (relapseLogged) riskPoints += 10;
  const actionBonus = Math.min(dailyActionsCompleted * 4, 20);
  riskPoints = Math.max(0, riskPoints - actionBonus);

  const rawScore = 100 - riskPoints;
  const score = clamp(Math.round(rawScore), 0, 100);
  const status = getStatus(score);

  const scores = Array.isArray(previousScores) ? previousScores : [];
  const trend = getTrend(scores);
  const yesterdayScore = scores.length > 0 ? scores[0] : score;
  const changeFromYesterday = score - yesterdayScore;

  const { momentumScore, momentumLevel } = getMomentum(score, scores, dailyActionsCompleted);
  const drivers = buildDrivers(data, score, status);

  return {
    score,
    status,
    trend,
    changeFromYesterday,
    momentumScore,
    momentumLevel,
    drivers,
  };
}
