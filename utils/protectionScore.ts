/**
 * Centralized protection score calculation. Use this in screens — do not calculate in UI.
 * Higher intensity / poor sleep / more triggers reduce score; higher support increases it.
 */

export type ProtectionStatus =
  | 'High Alert'
  | 'Guarded'
  | 'Strengthening'
  | 'Stable';

export interface ProtectionScoreInput {
  intensity?: number | null; // 1–5
  sleepQuality?: string | null;
  triggers?: string[] | null;
  supportLevel?: string | null;
}

export interface ProtectionScoreResult {
  score: number; // 0–100
  status: ProtectionStatus;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const SLEEP_WEIGHTS: Record<string, number> = {
  poor: 18,
  fair: 10,
  good: 4,
  excellent: 0,
};

const SUPPORT_WEIGHTS: Record<string, number> = {
  none: 20,
  limited: 12,
  moderate: 5,
  strong: 0,
};

/**
 * Calculate protection score from profile-like data.
 * Safe defaults for missing fields; result always clamped 0–100.
 */
export function calculateProtectionScore(data: ProtectionScoreInput): ProtectionScoreResult {
  const intensity =
    typeof data.intensity === 'number' && !Number.isNaN(data.intensity)
      ? data.intensity
      : 3;
  const safeIntensity = clamp(intensity, 1, 5);

  const sleepQuality = data.sleepQuality ?? 'fair';
  const sleepRisk = SLEEP_WEIGHTS[sleepQuality] ?? 10;

  const triggerCount = Array.isArray(data.triggers) ? data.triggers.length : 0;
  const triggerRisk = Math.min(clamp(triggerCount, 0, 50) * 3, 30);

  const supportLevel = data.supportLevel ?? 'limited';
  const supportRisk = SUPPORT_WEIGHTS[supportLevel] ?? 10;

  // Risk contributors: higher = worse. Invert to get protection.
  const intensityRisk = ((safeIntensity - 1) / 4) * 30; // 0 at 1, 30 at 5
  const totalRisk =
    intensityRisk + sleepRisk + triggerRisk + supportRisk;
  const rawScore = 100 - totalRisk;
  const score = clamp(Math.round(rawScore), 0, 100);

  let status: ProtectionStatus;
  if (score < 40) {
    status = 'High Alert';
  } else if (score < 60) {
    status = 'Guarded';
  } else if (score < 80) {
    status = 'Strengthening';
  } else {
    status = 'Stable';
  }

  return { score, status };
}
