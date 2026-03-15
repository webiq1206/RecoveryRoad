/**
 * Check-in metrics and emotional tags (data only; icons wired in hook/screen).
 */

import type { EmotionalTag } from '@/types';

export const CHECKIN_METRIC_KEYS = [
  'mood',
  'cravingLevel',
  'stress',
  'sleepQuality',
  'environment',
  'emotionalState',
] as const;

export type CheckInMetricKey = (typeof CHECKIN_METRIC_KEYS)[number];

export interface MetricConfig {
  key: CheckInMetricKey;
  label: string;
  iconKey: string;
  color: string;
  lowLabel: string;
  highLabel: string;
}

export const METRICS_CONFIG: MetricConfig[] = [
  { key: 'mood', label: 'Mood', iconKey: 'heart', color: '#FF6B9D', lowLabel: 'Low', highLabel: 'Great' },
  { key: 'cravingLevel', label: 'Cravings', iconKey: 'zap', color: '#FF6B35', lowLabel: 'None', highLabel: 'Intense' },
  { key: 'stress', label: 'Stress', iconKey: 'activity', color: '#FFC107', lowLabel: 'Calm', highLabel: 'High' },
  { key: 'sleepQuality', label: 'Sleep', iconKey: 'moon', color: '#7C8CF8', lowLabel: 'Poor', highLabel: 'Restful' },
  { key: 'environment', label: 'Environment', iconKey: 'mapPin', color: '#2EC4B6', lowLabel: 'Risky', highLabel: 'Safe' },
  { key: 'emotionalState', label: 'Emotions', iconKey: 'brain', color: '#CE93D8', lowLabel: 'Unstable', highLabel: 'Balanced' },
];

export interface EmotionalTagConfig {
  key: EmotionalTag;
  label: string;
  helper: string;
}

export const EMOTIONAL_TAGS: EmotionalTagConfig[] = [
  { key: 'anxious', label: 'Anxious', helper: 'on edge, keyed up, worried' },
  { key: 'lonely', label: 'Lonely', helper: 'disconnected, unseen, isolated' },
  { key: 'ashamed', label: 'Ashamed', helper: 'guilty, embarrassed, self-blaming' },
  { key: 'angry', label: 'Angry', helper: 'irritated, resentful, frustrated' },
  { key: 'hopeful', label: 'Hopeful', helper: 'light, optimistic, possibility' },
  { key: 'numb', label: 'Numb', helper: 'shut down, flat, checked out' },
];

export type CheckInTimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface PeriodConfigData {
  label: string;
  color: string;
  greeting: string;
}

export const PERIOD_CONFIG_DATA: Record<CheckInTimeOfDay, PeriodConfigData> = {
  morning: { label: 'Morning', color: '#FFC107', greeting: 'Good morning' },
  afternoon: { label: 'Afternoon', color: '#FF6B35', greeting: 'Good afternoon' },
  evening: { label: 'Evening', color: '#7C8CF8', greeting: 'Good evening' },
};
