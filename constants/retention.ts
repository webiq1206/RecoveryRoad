import { RetentionLoopType, MicroProgressCategory } from '@/types';

export const RETENTION_LOOPS: {
  id: RetentionLoopType;
  label: string;
  description: string;
  color: string;
  icon: string;
  triggers: string[];
  reinforcementMessages: string[];
}[] = [
  {
    id: 'relief',
    label: 'Relief Loop',
    description: 'Finding calm when things feel heavy',
    color: '#66BB6A',
    icon: 'leaf',
    triggers: ['check_in_after_craving', 'crisis_tool_used', 'breathing_completed', 'mood_improved_after_action'],
    reinforcementMessages: [
      "You found your way back to calm. That's real strength.",
      "The storm passed, and you stayed grounded. Notice that.",
      "You reached for a tool instead of an old pattern. That matters.",
      "Relief came because you chose it. Remember this feeling.",
      "Your nervous system is learning new pathways. Every calm moment counts.",
    ],
  },
  {
    id: 'growth',
    label: 'Growth Loop',
    description: 'Becoming more than your past',
    color: '#42A5F5',
    icon: 'trending-up',
    triggers: ['journal_written', 'exercise_completed', 'goal_progress', 'identity_work', 'exercise_completed'],
    reinforcementMessages: [
      "You're not just recovering — you're evolving.",
      "Every insight you write down becomes part of your foundation.",
      "Growth often feels invisible. But look how far you've come.",
      "The work you're doing today is building tomorrow's freedom.",
      "You're developing wisdom that only comes from lived experience.",
    ],
  },
  {
    id: 'control',
    label: 'Control Loop',
    description: 'Building trust in your own choices',
    color: '#FFB347',
    icon: 'shield',
    triggers: ['pledge_honored', 'routine_completed', 'trigger_managed', 'boundary_set', 'habit_practiced'],
    reinforcementMessages: [
      "You made a choice aligned with who you want to be.",
      "Control isn't about perfection — it's about intention. You showed that today.",
      "Every time you follow through, you build trust with yourself.",
      "Your consistency is quietly rewriting your self-image.",
      "You're proving to yourself that you can be relied on.",
    ],
  },
  {
    id: 'belonging',
    label: 'Belonging Loop',
    description: 'Knowing you are not alone in this',
    color: '#AB47BC',
    icon: 'users',
    triggers: ['community_engaged', 'partner_contacted', 'room_joined', 'support_shared', 'encouragement_given'],
    reinforcementMessages: [
      "Connection is medicine. You chose it today.",
      "Reaching out takes courage. You have it.",
      "You don't have to carry this alone. And you're not.",
      "Someone else's day got better because you showed up.",
      "Belonging isn't earned — it's chosen. You chose it today.",
    ],
  },
];

export const MICRO_PROGRESS_DEFINITIONS: {
  category: MicroProgressCategory;
  label: string;
  description: string;
  color: string;
  icon: string;
  unit: string;
  milestones: number[];
}[] = [
  {
    category: 'emotional_regulation',
    label: 'Emotional Regulation',
    description: 'Days with stable mood patterns',
    color: '#66BB6A',
    icon: 'heart-pulse',
    unit: 'stable days',
    milestones: [3, 7, 14, 21, 30, 60],
  },
  {
    category: 'trigger_reduction',
    label: 'Trigger Reduction',
    description: 'Decrease in craving intensity over time',
    color: '#EF5350',
    icon: 'trending-down',
    unit: '% reduction',
    milestones: [10, 20, 30, 50, 70],
  },
  {
    category: 'confidence_growth',
    label: 'Confidence Growth',
    description: 'Growing trust in your recovery ability',
    color: '#42A5F5',
    icon: 'mountain',
    unit: 'confidence score',
    milestones: [20, 40, 60, 80, 95],
  },
  {
    category: 'consistency',
    label: 'Consistency',
    description: 'Showing up for your recovery daily',
    color: '#2EC4B6',
    icon: 'calendar-check',
    unit: 'day streak',
    milestones: [3, 7, 14, 30, 60, 90],
  },
  {
    category: 'connection',
    label: 'Connection',
    description: 'Building meaningful recovery relationships',
    color: '#AB47BC',
    icon: 'users',
    unit: 'interactions',
    milestones: [5, 15, 30, 50, 100],
  },
  {
    category: 'self_awareness',
    label: 'Self-Awareness',
    description: 'Understanding your patterns and needs',
    color: '#FFB347',
    icon: 'eye',
    unit: 'insights',
    milestones: [3, 10, 20, 40, 75],
  },
];

export const TRIGGER_REDUCTION_MILESTONES = [
  { threshold: 10, title: 'First Shift', description: '10% reduction in craving intensity. The change has begun.' },
  { threshold: 20, title: 'Building Momentum', description: '20% reduction. Your brain is rewiring.' },
  { threshold: 30, title: 'Significant Progress', description: '30% reduction. Patterns are truly changing.' },
  { threshold: 50, title: 'Halfway There', description: '50% reduction. You are a different person now.' },
  { threshold: 70, title: 'Deep Healing', description: '70% reduction. Freedom is becoming your default.' },
];

export const CONFIDENCE_FACTORS = [
  'consecutive_sober_days',
  'managed_high_craving',
  'completed_check_ins',
  'journal_reflections',
  'community_connections',
  'goals_progressed',
  'crisis_navigated',
  'routine_adherence',
];

export const BEHAVIORAL_NOTIFICATION_TEMPLATES: {
  pattern: string;
  type: 'relief' | 'growth' | 'control' | 'belonging' | 'milestone' | 'gentle_nudge';
  title: string;
  messages: string[];
  timing: 'morning' | 'afternoon' | 'evening' | 'adaptive';
}[] = [
  {
    pattern: 'morning_routine',
    type: 'control',
    title: 'Your Morning Awaits',
    messages: [
      "A new day, a new chance to choose well. Your routine is ready when you are.",
      "Good morning. Start small — even one intentional choice sets the tone.",
      "Today doesn't need to be perfect. Just present.",
    ],
    timing: 'morning',
  },
  {
    pattern: 'evening_reflection',
    type: 'growth',
    title: 'Reflect & Rest',
    messages: [
      "Before you rest, take a moment to notice something you did well today.",
      "The day is ending. Whatever happened, you made it through with dignity.",
      "Rest well tonight. Tomorrow, you'll be a little stronger than today.",
    ],
    timing: 'evening',
  },
  {
    pattern: 'missed_checkin',
    type: 'gentle_nudge',
    title: 'We Noticed You',
    messages: [
      "No pressure, but we're here whenever you're ready to check in.",
      "Missing a day is human. Coming back is what matters.",
      "Your recovery doesn't depend on perfection. Just on returning.",
    ],
    timing: 'adaptive',
  },
  {
    pattern: 'streak_celebration',
    type: 'milestone',
    title: 'Quiet Victory',
    messages: [
      "You've been showing up consistently. That's not small — it's everything.",
      "Your streak reflects something deeper: commitment to yourself.",
      "Consistency isn't glamorous, but it's where real change lives.",
    ],
    timing: 'afternoon',
  },
  {
    pattern: 'emotional_stability',
    type: 'relief',
    title: 'Steady Ground',
    messages: [
      "Your emotional balance has been improving. Your nervous system is healing.",
      "The calm you're feeling? You built that. One day at a time.",
      "Stability doesn't mean you won't feel. It means you can hold what you feel.",
    ],
    timing: 'afternoon',
  },
  {
    pattern: 'isolation_detected',
    type: 'belonging',
    title: 'You Are Not Alone',
    messages: [
      "It's been a while since you connected. Someone out there understands.",
      "Isolation is a pattern, not a preference. Reach out when you're ready.",
      "Recovery is stronger in community. Your people are waiting for you.",
    ],
    timing: 'adaptive',
  },
  {
    pattern: 'craving_reduction',
    type: 'growth',
    title: 'Progress You Can Feel',
    messages: [
      "Your craving levels have been decreasing. Your brain is rewiring itself.",
      "The urges are losing their grip. You're winning a quiet battle.",
      "Each day the cravings weaken, your freedom grows stronger.",
    ],
    timing: 'afternoon',
  },
  {
    pattern: 'confidence_milestone',
    type: 'control',
    title: 'Trust Building',
    messages: [
      "Your confidence in your recovery is growing. You're earning your own trust.",
      "Every managed trigger, every honored pledge — they all add up to this moment.",
      "You're becoming someone you can rely on. That's the deepest kind of healing.",
    ],
    timing: 'afternoon',
  },
];
