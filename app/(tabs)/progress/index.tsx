import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import {
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Brain,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Minus,
  Activity,
  ChevronRight,
  Eye,
  AlertTriangle,
  Moon,
  Sun,
  Sunset,
  CloudMoon,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRecovery } from '@/providers/RecoveryProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { DailyCheckIn } from '@/types';
import { PremiumSectionOverlay } from '@/components/PremiumGate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 72;
const CHART_HEIGHT = 100;

const RECOVERY_STAGES = [
  { minDays: 0, label: 'Withdrawal', color: '#EF5350', desc: 'Your body is adjusting. Every hour counts.' },
  { minDays: 3, label: 'Early Abstinence', color: '#FF9800', desc: 'Building new patterns. Stay close to support.' },
  { minDays: 14, label: 'Protracted Abstinence', color: '#FFC107', desc: 'Deeper healing underway. Keep going.' },
  { minDays: 30, label: 'Stabilization', color: '#66BB6A', desc: 'New habits forming. You are getting stronger.' },
  { minDays: 90, label: 'Early Recovery', color: '#26A69A', desc: 'Real change is taking hold. Trust the process.' },
  { minDays: 180, label: 'Sustained Recovery', color: '#2EC4B6', desc: 'Growth is compounding. You are transforming.' },
  { minDays: 365, label: 'Advanced Recovery', color: '#42A5F5', desc: 'A new life is unfolding. Inspire others.' },
];

const REINFORCEMENT_MESSAGES = [
  "Every single day you choose yourself is a victory.",
  "You are rewriting your story, one brave moment at a time.",
  "The strength you show today builds the life you deserve tomorrow.",
  "Progress isn't always visible — but it's always happening inside you.",
  "You've already survived 100% of your hardest days.",
  "Healing isn't linear, but you're on the right path.",
  "The person you're becoming is worth every effort.",
  "Your courage to keep going is extraordinary.",
  "Small steps still move you forward.",
  "You are more resilient than you know.",
];

function getRecoveryStage(days: number) {
  let stage = RECOVERY_STAGES[0];
  for (const s of RECOVERY_STAGES) {
    if (days >= s.minDays) stage = s;
  }
  const nextIdx = RECOVERY_STAGES.indexOf(stage) + 1;
  const next = nextIdx < RECOVERY_STAGES.length ? RECOVERY_STAGES[nextIdx] : null;
  const progress = next
    ? Math.min((days - stage.minDays) / (next.minDays - stage.minDays), 1)
    : 1;
  return { ...stage, progress, nextStage: next };
}

function getReinforcementMessage(days: number): string {
  return REINFORCEMENT_MESSAGES[days % REINFORCEMENT_MESSAGES.length];
}

function computeTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  const recent = values.slice(0, Math.min(3, values.length));
  const older = values.slice(Math.min(3, values.length), Math.min(7, values.length));
  if (older.length === 0) return 'stable';
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const diff = recentAvg - olderAvg;
  if (Math.abs(diff) < 3) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function MiniBarChart({ data, color, maxVal }: { data: number[]; color: string; maxVal: number }) {
  const bars = data.slice(0, 7).reverse();
  const barWidth = Math.min((CHART_WIDTH - (bars.length - 1) * 4) / Math.max(bars.length, 1), 28);

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {bars.map((val, i) => {
          const height = maxVal > 0 ? Math.max((val / maxVal) * CHART_HEIGHT, 4) : 4;
          return (
            <View key={i} style={chartStyles.barWrapper}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height,
                    width: barWidth,
                    backgroundColor: color,
                    opacity: i === bars.length - 1 ? 1 : 0.4 + (i / bars.length) * 0.5,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={chartStyles.labelsRow}>
        {bars.map((_, i) => (
          <Text key={i} style={[chartStyles.label, { width: barWidth }]}>
            {bars.length - i === 1 ? 'Today' : `${bars.length - i}d`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const points = data.slice(0, 7).reverse();
  if (points.length < 2) {
    return (
      <View style={[chartStyles.container, { alignItems: 'center', justifyContent: 'center', height: CHART_HEIGHT }]}>
        <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Need more data</Text>
      </View>
    );
  }
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (points.length - 1);

  return (
    <View style={[chartStyles.container, { height: CHART_HEIGHT + 30 }]}>
      <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH, position: 'relative' }}>
        {points.map((val, i) => {
          if (i === points.length - 1) return null;
          const x1 = i * stepX;
          const y1 = CHART_HEIGHT - ((val - min) / range) * (CHART_HEIGHT - 8) - 4;
          const x2 = (i + 1) * stepX;
          const y2 = CHART_HEIGHT - ((points[i + 1] - min) / range) * (CHART_HEIGHT - 8) - 4;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: length,
                height: 2.5,
                backgroundColor: color,
                borderRadius: 1.5,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
                opacity: 0.8,
              }}
            />
          );
        })}
        {points.map((val, i) => {
          const x = i * stepX;
          const y = CHART_HEIGHT - ((val - min) / range) * (CHART_HEIGHT - 8) - 4;
          return (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                left: x - 4,
                top: y - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === points.length - 1 ? color : 'transparent',
                borderWidth: 2,
                borderColor: color,
              }}
            />
          );
        })}
      </View>
      <View style={[chartStyles.labelsRow, { marginTop: 6 }]}>
        {points.map((_, i) => (
          <Text key={i} style={[chartStyles.label, { width: stepX, textAlign: 'center' }]}>
            {points.length - i === 1 ? 'Now' : `${points.length - i}d`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function VulnerabilityMeter({ score }: { score: number }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animVal, {
      toValue: score,
      useNativeDriver: false,
      tension: 30,
      friction: 10,
    }).start();
  }, [score]);

  const level = score <= 25 ? 'Low' : score <= 50 ? 'Moderate' : score <= 75 ? 'Elevated' : 'High';
  const levelColor = score <= 25 ? '#66BB6A' : score <= 50 ? '#FFC107' : score <= 75 ? '#FF9800' : '#EF5350';
  const levelDesc = score <= 25
    ? 'You are in a strong place right now.'
    : score <= 50
      ? 'Stay mindful. Use your tools if needed.'
      : score <= 75
        ? 'Reach out to your support circle today.'
        : 'Consider activating Crisis Mode.';

  const widthInterp = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.header}>
        <View style={meterStyles.headerLeft}>
          <Shield size={18} color={levelColor} />
          <Text style={meterStyles.title}>Relapse Vulnerability</Text>
        </View>
        <View style={[meterStyles.badge, { backgroundColor: levelColor + '22' }]}>
          <Text style={[meterStyles.badgeText, { color: levelColor }]}>{level}</Text>
        </View>
      </View>
      <View style={meterStyles.trackOuter}>
        <Animated.View style={[meterStyles.trackFill, { width: widthInterp, backgroundColor: levelColor }]} />
        <View style={[meterStyles.marker, { left: '25%' }]} />
        <View style={[meterStyles.marker, { left: '50%' }]} />
        <View style={[meterStyles.marker, { left: '75%' }]} />
      </View>
      <Text style={meterStyles.desc}>{levelDesc}</Text>
    </View>
  );
}

function TrendIcon({ trend, positiveDirection }: { trend: 'up' | 'down' | 'stable'; positiveDirection: 'up' | 'down' }) {
  const isGood = (trend === 'up' && positiveDirection === 'up') || (trend === 'down' && positiveDirection === 'down');
  const color = trend === 'stable' ? Colors.textMuted : isGood ? '#66BB6A' : '#EF5350';
  if (trend === 'up') return <ChevronUp size={14} color={color} />;
  if (trend === 'down') return <ChevronDown size={14} color={color} />;
  return <Minus size={14} color={color} />;
}

const TRIGGER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TRIGGER_TIME_BLOCKS = [
  { label: 'Morning', key: 'morning', icon: Sun, hours: [6, 7, 8, 9, 10, 11] },
  { label: 'Afternoon', key: 'afternoon', icon: Sunset, hours: [12, 13, 14, 15, 16, 17] },
  { label: 'Evening', key: 'evening', icon: CloudMoon, hours: [18, 19, 20, 21] },
  { label: 'Night', key: 'night', icon: Moon, hours: [22, 23, 0, 1, 2, 3, 4, 5] },
] as const;

const HEAT_COLORS = [
  'rgba(46, 196, 182, 0.08)',
  'rgba(46, 196, 182, 0.2)',
  'rgba(255, 193, 7, 0.35)',
  'rgba(255, 107, 53, 0.5)',
  'rgba(239, 83, 80, 0.7)',
];

function getHeatLevel(value: number): number {
  if (value <= 20) return 0;
  if (value <= 40) return 1;
  if (value <= 60) return 2;
  if (value <= 80) return 3;
  return 4;
}

interface TriggerHeatmapData {
  [dayIndex: number]: {
    [timeBlock: string]: number;
  };
}

interface TriggerPatternInsight {
  id: string;
  type: 'warning' | 'pattern' | 'positive';
  title: string;
  description: string;
}

export default function ProgressScreen() {
  const router = useRouter();
  const { profile, daysSober, checkIns, stabilityScore, journal, pledges, currentStreak } = useRecovery();
  const { hasFeature } = useSubscription();
  const [triggerExpanded, setTriggerExpanded] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const sobrietyData = useMemo(() => {
    const weeks = Math.floor(daysSober / 7);
    const months = Math.floor(daysSober / 30);
    const years = Math.floor(daysSober / 365);
    return { days: daysSober, weeks, months, years };
  }, [daysSober]);

  const stage = useMemo(() => getRecoveryStage(daysSober), [daysSober]);

  const emotionalGrowth = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const moods = sorted.map((c: DailyCheckIn) => c.mood);
    const avgMood = moods.length > 0 ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length : 50;
    const trend = computeTrend(moods);
    return { moods: moods.slice(0, 7), avgMood: Math.round(avgMood), trend };
  }, [checkIns]);

  const triggerData = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const cravings = sorted.map((c: DailyCheckIn) => c.cravingLevel);
    const avgCraving = cravings.length > 0 ? cravings.reduce((a: number, b: number) => a + b, 0) / cravings.length : 50;
    const trend = computeTrend(cravings);
    return { cravings: cravings.slice(0, 7), avgCraving: Math.round(avgCraving), trend };
  }, [checkIns]);

  const stabilityData = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const scores = sorted.map((c: DailyCheckIn) => c.stabilityScore);
    const trend = computeTrend(scores);
    return { scores: scores.slice(0, 7), trend };
  }, [checkIns]);

  const vulnerabilityScore = useMemo(() => {
    if (checkIns.length === 0) return 40;
    const recent = [...checkIns]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    const avgCraving = recent.reduce((s, c) => s + c.cravingLevel, 0) / recent.length;
    const avgStress = recent.reduce((s, c) => s + c.stress, 0) / recent.length;
    const avgSleep = recent.reduce((s, c) => s + c.sleepQuality, 0) / recent.length;
    const avgMood = recent.reduce((s, c) => s + c.mood, 0) / recent.length;
    const rawScore = (avgCraving * 0.35) + (avgStress * 0.25) + ((100 - avgSleep) * 0.2) + ((100 - avgMood) * 0.2);
    const streakBonus = Math.min(currentStreak * 2, 15);
    return Math.max(0, Math.min(100, Math.round(rawScore - streakBonus)));
  }, [checkIns, currentStreak]);

  const reinforcementMessage = useMemo(() => getReinforcementMessage(daysSober), [daysSober]);

  const recentCheckIns30 = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return checkIns.filter(c => new Date(c.date) >= thirtyDaysAgo);
  }, [checkIns]);

  const triggerHeatmap = useMemo<TriggerHeatmapData>(() => {
    const data: TriggerHeatmapData = {};
    for (let d = 0; d < 7; d++) {
      data[d] = {};
      for (const tb of TRIGGER_TIME_BLOCKS) {
        data[d][tb.key] = 0;
      }
    }
    if (recentCheckIns30.length === 0) return data;
    const counts: Record<string, number> = {};
    recentCheckIns30.forEach(ci => {
      const date = new Date(ci.completedAt || ci.date);
      const dayOfWeek = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      const timeBlock = TRIGGER_TIME_BLOCKS.find(tb => (tb.hours as readonly number[]).includes(hour));
      if (!timeBlock) return;
      const key = `${dayOfWeek}-${timeBlock.key}`;
      const riskValue = ((ci.cravingLevel + ci.stress + (100 - ci.mood)) / 3);
      if (!counts[key]) counts[key] = 0;
      const prevTotal = (data[dayOfWeek][timeBlock.key] || 0) * counts[key];
      counts[key]++;
      data[dayOfWeek][timeBlock.key] = (prevTotal + riskValue) / counts[key];
    });
    return data;
  }, [recentCheckIns30]);

  const highRiskTimes = useMemo(() => {
    const risks: { day: string; time: string; value: number }[] = [];
    for (let d = 0; d < 7; d++) {
      for (const tb of TRIGGER_TIME_BLOCKS) {
        const val = triggerHeatmap[d]?.[tb.key] ?? 0;
        if (val > 50) {
          risks.push({ day: TRIGGER_DAYS[d], time: tb.label, value: val });
        }
      }
    }
    return risks.sort((a, b) => b.value - a.value).slice(0, 3);
  }, [triggerHeatmap]);

  const triggerInsights = useMemo<TriggerPatternInsight[]>(() => {
    if (recentCheckIns30.length < 3) {
      return [{ id: 'need-data', type: 'pattern', title: 'Building your pattern map', description: 'Complete more daily check-ins to identify trigger patterns.' }];
    }
    const result: TriggerPatternInsight[] = [];
    const avgCraving = recentCheckIns30.reduce((s, c) => s + c.cravingLevel, 0) / recentCheckIns30.length;
    const avgStress = recentCheckIns30.reduce((s, c) => s + c.stress, 0) / recentCheckIns30.length;
    const avgMood = recentCheckIns30.reduce((s, c) => s + c.mood, 0) / recentCheckIns30.length;
    if (avgCraving > 65) {
      result.push({ id: 'high-craving', type: 'warning', title: 'Elevated craving pattern', description: 'Cravings have been consistently high. Consider engaging crisis tools.' });
    }
    if (avgStress > 60 && avgCraving > 50) {
      result.push({ id: 'stress-link', type: 'pattern', title: 'Stress-craving connection', description: 'When stress rises, cravings follow. Try breathing exercises.' });
    }
    if (highRiskTimes.length > 0) {
      const top = highRiskTimes[0];
      result.push({ id: 'peak-time', type: 'pattern', title: `${top.day} ${top.time.toLowerCase()}s are high-risk`, description: 'Having a plan for these times can make a difference.' });
    }
    if (avgCraving < 30 && avgMood > 60) {
      result.push({ id: 'positive', type: 'positive', title: 'Strong stability pattern', description: 'Low cravings and good mood. Keep building on what works.' });
    }
    if (result.length === 0) {
      result.push({ id: 'stable', type: 'positive', title: 'Patterns look balanced', description: 'No concerning patterns. Keep up daily check-ins.' });
    }
    return result;
  }, [recentCheckIns30, highRiskTimes]);

  const overallTriggerRisk = useMemo(() => {
    if (recentCheckIns30.length === 0) return 0;
    const recent = recentCheckIns30.slice(0, 7);
    const avgCraving = recent.reduce((s, c) => s + c.cravingLevel, 0) / recent.length;
    const avgStress = recent.reduce((s, c) => s + c.stress, 0) / recent.length;
    const avgMood = recent.reduce((s, c) => s + c.mood, 0) / recent.length;
    return Math.round((avgCraving * 0.4 + avgStress * 0.3 + (100 - avgMood) * 0.3));
  }, [recentCheckIns30]);

  const triggerRiskColor = overallTriggerRisk > 65 ? '#EF5350' : overallTriggerRisk > 40 ? '#FFC107' : Colors.primary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="progress-screen"
    >
      <Animated.View style={[styles.sobrietyHero, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroInner}>
          <Clock size={20} color={Colors.primary} />
          <Text style={styles.heroLabel}>Time Reclaimed</Text>
          <Text style={styles.heroDays}>{sobrietyData.days}</Text>
          <Text style={styles.heroDaysLabel}>days sober</Text>
          <View style={styles.heroMetaRow}>
            {sobrietyData.years > 0 && (
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaValue}>{sobrietyData.years}</Text>
                <Text style={styles.heroMetaLabel}>{sobrietyData.years === 1 ? 'year' : 'years'}</Text>
              </View>
            )}
            {sobrietyData.months > 0 && (
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaValue}>{sobrietyData.months}</Text>
                <Text style={styles.heroMetaLabel}>{sobrietyData.months === 1 ? 'month' : 'months'}</Text>
              </View>
            )}
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaValue}>{sobrietyData.weeks}</Text>
              <Text style={styles.heroMetaLabel}>{sobrietyData.weeks === 1 ? 'week' : 'weeks'}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.reinforcementCard}>
        <Sparkles size={16} color="#FFD54F" />
        <Text style={styles.reinforcementText}>{reinforcementMessage}</Text>
      </View>

      <View style={styles.stageCard}>
        <View style={styles.stageHeader}>
          <Activity size={18} color={stage.color} />
          <Text style={styles.stageTitle}>Recovery Stage</Text>
        </View>
        <Text style={[styles.stageName, { color: stage.color }]}>{stage.label}</Text>
        <Text style={styles.stageDesc}>{stage.desc}</Text>
        <View style={styles.stageProgressOuter}>
          <View style={[styles.stageProgressFill, { width: `${stage.progress * 100}%`, backgroundColor: stage.color }]} />
        </View>
        {stage.nextStage && (
          <Text style={styles.stageNext}>
            Next: {stage.nextStage.label} ({stage.nextStage.minDays - daysSober} days away)
          </Text>
        )}
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1, marginRight: 8 }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBg, { backgroundColor: '#2EC4B620' }]}>
              <Zap size={16} color={Colors.primary} />
            </View>
            <TrendIcon trend={stabilityData.trend} positiveDirection="up" />
          </View>
          <Text style={styles.metricValue}>{stabilityScore}</Text>
          <Text style={styles.metricLabel}>Stability</Text>
        </View>
        <View style={[styles.metricCard, { flex: 1, marginLeft: 4, marginRight: 4 }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBg, { backgroundColor: '#66BB6A20' }]}>
              <Heart size={16} color="#66BB6A" />
            </View>
            <TrendIcon trend={emotionalGrowth.trend} positiveDirection="up" />
          </View>
          <Text style={styles.metricValue}>{emotionalGrowth.avgMood}</Text>
          <Text style={styles.metricLabel}>Mood Avg</Text>
        </View>
        <View style={[styles.metricCard, { flex: 1, marginLeft: 8 }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBg, { backgroundColor: '#EF535020' }]}>
              <Brain size={16} color="#EF5350" />
            </View>
            <TrendIcon trend={triggerData.trend} positiveDirection="down" />
          </View>
          <Text style={styles.metricValue}>{triggerData.avgCraving}</Text>
          <Text style={styles.metricLabel}>Cravings</Text>
        </View>
      </View>

      {hasFeature('advanced_analytics') ? (
        <>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Heart size={16} color="#66BB6A" />
              <Text style={styles.chartTitle}>Emotional Growth</Text>
              <TrendIcon trend={emotionalGrowth.trend} positiveDirection="up" />
            </View>
            {emotionalGrowth.moods.length > 0 ? (
              <MiniBarChart data={emotionalGrowth.moods} color="#66BB6A" maxVal={100} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Complete daily check-ins to see trends</Text>
              </View>
            )}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Brain size={16} color="#EF5350" />
              <Text style={styles.chartTitle}>Trigger Reduction</Text>
              <TrendIcon trend={triggerData.trend} positiveDirection="down" />
            </View>
            {triggerData.cravings.length > 0 ? (
              <MiniBarChart data={triggerData.cravings} color="#EF5350" maxVal={100} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Complete daily check-ins to see trends</Text>
              </View>
            )}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <TrendingUp size={16} color={Colors.primary} />
              <Text style={styles.chartTitle}>Stability Trend</Text>
              <TrendIcon trend={stabilityData.trend} positiveDirection="up" />
            </View>
            {stabilityData.scores.length >= 2 ? (
              <MiniLineChart data={stabilityData.scores} color={Colors.primary} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Need at least 2 check-ins for trend</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.premiumGateCard}>
          <PremiumSectionOverlay
            feature="advanced_analytics"
            title="Advanced Analytics"
            description="Unlock detailed emotional growth charts, trigger reduction trends, and stability analysis to understand your recovery deeply."
          />
        </View>
      )}

      {hasFeature('predictive_engine') ? (
        <VulnerabilityMeter score={vulnerabilityScore} />
      ) : (
        <View style={styles.premiumGateCard}>
          <PremiumSectionOverlay
            feature="predictive_engine"
            title="Relapse Vulnerability Meter"
            description="Unlock the predictive engine to see your real-time vulnerability score and get early warnings."
          />
        </View>
      )}

      <View style={trigStyles.card}>
        <Pressable
          style={trigStyles.header}
          onPress={() => {
            Haptics.selectionAsync();
            setTriggerExpanded(!triggerExpanded);
          }}
          testID="trigger-analysis-toggle"
        >
          <View style={trigStyles.headerLeft}>
            <View style={[trigStyles.headerIconBg, { backgroundColor: triggerRiskColor + '18' }]}>
              <Zap size={18} color={triggerRiskColor} />
            </View>
            <View style={trigStyles.headerTextWrap}>
              <Text style={trigStyles.headerTitle}>Trigger Analysis</Text>
              <Text style={trigStyles.headerSub}>
                {recentCheckIns30.length === 0
                  ? 'Complete check-ins to see patterns'
                  : `Risk level: ${overallTriggerRisk}%`}
              </Text>
            </View>
          </View>
          <View style={trigStyles.headerRight}>
            {recentCheckIns30.length > 0 && (
              <View style={[trigStyles.riskBadge, { backgroundColor: triggerRiskColor + '18' }]}>
                <Text style={[trigStyles.riskBadgeText, { color: triggerRiskColor }]}>{overallTriggerRisk}</Text>
              </View>
            )}
            {triggerExpanded ? <ChevronUp size={16} color={Colors.textMuted} /> : <ChevronDown size={16} color={Colors.textMuted} />}
          </View>
        </Pressable>

        {triggerExpanded && (
          <View style={trigStyles.body}>
            <View style={trigStyles.heatmapContainer}>
              <View style={trigStyles.heatRow}>
                <View style={trigStyles.heatLabelCell} />
                {TRIGGER_TIME_BLOCKS.map(tb => {
                  const Icon = tb.icon;
                  return (
                    <View key={tb.key} style={trigStyles.heatColHeader}>
                      <Icon size={12} color={Colors.textSecondary} />
                      <Text style={trigStyles.heatColLabel}>{tb.label.slice(0, 4)}</Text>
                    </View>
                  );
                })}
              </View>
              {TRIGGER_DAYS.map((day, dayIdx) => (
                <View key={day} style={trigStyles.heatRow}>
                  <View style={trigStyles.heatLabelCell}>
                    <Text style={trigStyles.heatDayLabel}>{day}</Text>
                  </View>
                  {TRIGGER_TIME_BLOCKS.map(tb => {
                    const val = triggerHeatmap[dayIdx]?.[tb.key] ?? 0;
                    const level = getHeatLevel(val);
                    return (
                      <View key={`${dayIdx}-${tb.key}`} style={trigStyles.heatCellWrap}>
                        <View style={[trigStyles.heatCell, { backgroundColor: HEAT_COLORS[level] }]}>
                          {val > 0 && (
                            <Text style={[trigStyles.heatCellText, level >= 3 && { color: Colors.text }]}>
                              {Math.round(val)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
              <View style={trigStyles.heatLegend}>
                <Text style={trigStyles.heatLegendLabel}>Low</Text>
                {HEAT_COLORS.map((color, i) => (
                  <View key={i} style={[trigStyles.heatLegendBox, { backgroundColor: color }]} />
                ))}
                <Text style={trigStyles.heatLegendLabel}>High</Text>
              </View>
            </View>

            {highRiskTimes.length > 0 && (
              <View style={trigStyles.riskTimesCard}>
                <Text style={trigStyles.riskTimesTitle}>High-Risk Windows</Text>
                {highRiskTimes.map((rt, idx) => (
                  <View key={idx} style={[trigStyles.riskTimeRow, idx === highRiskTimes.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={trigStyles.riskTimeLeft}>
                      <View style={[trigStyles.riskTimeDot, { backgroundColor: rt.value > 70 ? '#EF5350' : '#FFC107' }]} />
                      <Text style={trigStyles.riskTimeText}>{rt.day} {rt.time}</Text>
                    </View>
                    <View style={[trigStyles.riskTimeBadge, { backgroundColor: rt.value > 70 ? 'rgba(239,83,80,0.15)' : 'rgba(255,193,7,0.15)' }]}>
                      <Text style={[trigStyles.riskTimeBadgeText, { color: rt.value > 70 ? '#EF5350' : '#FFC107' }]}>{Math.round(rt.value)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={trigStyles.insightsContainer}>
              {triggerInsights.map(insight => {
                const iconColor = insight.type === 'warning' ? '#EF5350' : insight.type === 'positive' ? '#66BB6A' : '#FFB347';
                const bgColor = insight.type === 'warning' ? 'rgba(239,83,80,0.08)' : insight.type === 'positive' ? 'rgba(76,175,80,0.08)' : 'rgba(255,179,71,0.08)';
                const IconComp = insight.type === 'warning' ? AlertTriangle : insight.type === 'positive' ? Shield : TrendingUp;
                return (
                  <View key={insight.id} style={[trigStyles.insightCard, { backgroundColor: bgColor }]}>
                    <View style={trigStyles.insightRow}>
                      <IconComp size={14} color={iconColor} />
                      <View style={trigStyles.insightTextWrap}>
                        <Text style={trigStyles.insightTitle}>{insight.title}</Text>
                        <Text style={trigStyles.insightDesc}>{insight.description}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {(profile.recoveryProfile?.triggers ?? []).length > 0 && (
              <View style={trigStyles.knownTriggersWrap}>
                <Text style={trigStyles.knownTriggersLabel}>Known Triggers</Text>
                <View style={trigStyles.triggerChips}>
                  {(profile.recoveryProfile?.triggers ?? []).map((trigger, idx) => (
                    <View key={idx} style={trigStyles.triggerChip}>
                      <View style={trigStyles.triggerChipDot} />
                      <Text style={trigStyles.triggerChipText}>{trigger}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <Pressable
        style={styles.detectionLink}
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/retention-insights' as any);
        }}
        testID="progress-retention-insights-link"
      >
        <View style={styles.detectionLinkLeft}>
          <View style={[styles.detectionLinkIcon, { backgroundColor: '#FFD54F15' }]}>
            <Sparkles size={16} color="#FFD54F" />
          </View>
          <View>
            <Text style={styles.detectionLinkTitle}>Recovery Insights</Text>
            <Text style={styles.detectionLinkSub}>Emotional loops, micro-progress & confidence</Text>
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </Pressable>

      <Pressable
        style={styles.detectionLink}
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/relapse-detection' as any);
        }}
        testID="progress-relapse-detection-link"
      >
        <View style={styles.detectionLinkLeft}>
          <View style={styles.detectionLinkIcon}>
            <Eye size={16} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.detectionLinkTitle}>Advanced Relapse Detection</Text>
            <Text style={styles.detectionLinkSub}>Risk score, patterns, alerts & more</Text>
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </Pressable>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Journey So Far</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{checkIns.length}</Text>
            <Text style={styles.summaryLabel}>Check-ins</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{journal.length}</Text>
            <Text style={styles.summaryLabel}>Journal Entries</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{currentStreak}</Text>
            <Text style={styles.summaryLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT,
  },
  bar: {
    borderRadius: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

const meterStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  trackOuter: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  trackFill: {
    height: 8,
    borderRadius: 4,
  },
  marker: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 8,
    backgroundColor: Colors.border,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  sobrietyHero: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    opacity: 0.06,
    borderRadius: 20,
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroDays: {
    fontSize: 56,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginTop: 4,
    lineHeight: 64,
  },
  heroDaysLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  heroMetaItem: {
    alignItems: 'center',
  },
  heroMetaValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  heroMetaLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reinforcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFD54F12',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#FFD54F30',
  },
  reinforcementText: {
    flex: 1,
    fontSize: 13,
    color: '#FFD54F',
    fontWeight: '500' as const,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  stageCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stageName: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  stageDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  stageProgressOuter: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stageProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  stageNext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  metricCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricIconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyChart: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  premiumGateCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(212,165,116,0.2)',
    overflow: 'hidden',
  },
  detectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  detectionLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detectionLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionLinkTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  detectionLinkSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

const trigStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 64,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 14,
    gap: 14,
  },
  heatmapContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
  },
  heatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heatLabelCell: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  heatDayLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  heatColHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 1,
  },
  heatColLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  heatCellWrap: {
    flex: 1,
  },
  heatCell: {
    height: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1.5,
  },
  heatCellText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 8,
  },
  heatLegendLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginHorizontal: 3,
  },
  heatLegendBox: {
    width: 16,
    height: 10,
    borderRadius: 2,
  },
  riskTimesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  riskTimesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  riskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  riskTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskTimeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  riskTimeText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  riskTimeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskTimeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  insightsContainer: {
    gap: 8,
  },
  insightCard: {
    borderRadius: 10,
    padding: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  insightDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  knownTriggersWrap: {
    gap: 8,
  },
  knownTriggersLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  triggerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  triggerChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  triggerChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
  },
});
