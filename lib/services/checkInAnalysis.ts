/**
 * Check-in analysis: reflections, score labels, and emotional notes.
 * Single source of truth for daily check-in copy and thresholds.
 */

import type { DailyCheckIn } from '@/types';
import {
  getRecoveryStage,
  getRiskLevel,
  getEmotionalInsight,
} from '@/constants/companion';

export const REFLECTIONS: Record<string, string[]> = {
  excellent: [
    "You're in a strong place today. Keep riding this wave.",
    "Solid day. Your resilience is showing.",
    "You're building something powerful. One day at a time.",
  ],
  good: [
    "Steady progress. You're handling things well.",
    "Good awareness today. That's real strength.",
    "You're showing up for yourself. That matters.",
  ],
  moderate: [
    "It's okay to have mixed days. You're still here.",
    "Some tension is normal. You're navigating it.",
    "Take a breath. You've handled harder days than this.",
  ],
  challenging: [
    "Tough day, but you checked in. That's courage.",
    "Reach out to someone you trust today.",
    "This feeling will pass. You're stronger than you think.",
  ],
  difficult: [
    "You're brave for being honest. Consider calling a support contact.",
    "Right now is hard, but you've survived hard before.",
    "You don't have to do this alone. Reach out.",
  ],
};

export function getReflection(score: number): string {
  let category: string;
  if (score >= 80) category = 'excellent';
  else if (score >= 65) category = 'good';
  else if (score >= 45) category = 'moderate';
  else if (score >= 25) category = 'challenging';
  else category = 'difficult';

  const options = REFLECTIONS[category];
  return options[Math.floor(Math.random() * options.length)];
}

export function getEmotionalReflection(
  score: number,
  values: Record<string, number>,
  checkIns: DailyCheckIn[],
  daysSober: number,
): { reflection: string; emotionalNote: string } {
  const baseReflection = getReflection(score);
  const stage = getRecoveryStage(daysSober);
  const risk = getRiskLevel(checkIns, daysSober);

  let emotionalNote = '';

  if (values.cravingLevel > 70 && values.mood < 40) {
    emotionalNote =
      "High cravings with low mood is a signal worth paying attention to. Consider reaching out to your support network today.";
  } else if (values.emotionalState < 30) {
    emotionalNote =
      "Your emotions feel unstable right now. That's okay - awareness is the first step. Try a grounding exercise.";
  } else if (values.sleepQuality < 25) {
    emotionalNote =
      "Poor sleep affects everything. Tonight, try winding down 30 minutes earlier. Your recovery body needs rest.";
  } else if (values.stress > 75 && values.cravingLevel > 60) {
    emotionalNote =
      "Stress and cravings often travel together. Break the cycle with one small healthy action right now.";
  } else if (score >= 75) {
    const { insight } = getEmotionalInsight(checkIns, stage, risk);
    emotionalNote = insight;
  } else if (values.environment < 35) {
    emotionalNote =
      "Your environment feels risky. Can you change your surroundings, even temporarily? A new space can shift your state.";
  }

  return { reflection: baseReflection, emotionalNote };
}

export function getScoreColor(score: number): string {
  if (score >= 75) return '#2EC4B6';
  if (score >= 50) return '#FFC107';
  if (score >= 30) return '#FF6B35';
  return '#EF5350';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Steady';
  if (score >= 45) return 'Managing';
  if (score >= 25) return 'Tough';
  return 'Struggling';
}
