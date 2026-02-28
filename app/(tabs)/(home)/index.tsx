import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import {
  ArrowRight, BookOpen, MessageCircle, Sparkles,
  Sun, Sunset, Moon,
} from 'lucide-react-native';
import { getRecoveryStage, getRiskLevel } from '@/constants/companion';
import { getCrisisRiskCopy, getElevatedRiskCopy } from '@/constants/emotionalRisk';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRecovery } from '@/providers/RecoveryProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { HomeLoadingSkeleton } from '@/components/LoadingSkeleton';
import { CheckInTimeOfDay } from '@/types';

function getTimeOfDay(): CheckInTimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getGreeting(period: CheckInTimeOfDay): string {
  switch (period) {
    case 'morning': return 'Rise and shine';
    case 'afternoon': return 'Good afternoon';
    case 'evening': return 'Good evening';
  }
}

function getGreetingSubtext(period: CheckInTimeOfDay): string {
  switch (period) {
    case 'morning': return "A quick check-in sets your day up for success.";
    case 'afternoon': return "Steady as you go. How's your day shaping up?";
    case 'evening': return "Time to wind down and reflect.";
  }
}

function getEmotionalState(score: number): { label: string; emoji: string } {
  if (score >= 80) return { label: 'Feeling Strong', emoji: '💪' };
  if (score >= 60) return { label: 'Steady & Calm', emoji: '🌊' };
  if (score >= 40) return { label: 'Managing', emoji: '🟡' };
  if (score >= 20) return { label: 'Struggling', emoji: '🟠' };
  return { label: 'In Need of Support', emoji: '🆘' };
}

type PrimaryFocus = {
  title: string;
  description: string;
  action: string;
  route: string;
  label: string;
  accentColor: string;
  borderColor: string;
  iconBgColor: string;
};

function getPrimaryFocus(
  period: CheckInTimeOfDay,
  hasMorningCheckIn: boolean,
  hasAfternoonCheckIn: boolean,
  hasEveningCheckIn: boolean,
  hasPledge: boolean,
  riskLevel: string,
  stabilityScore: number,
  daysSober: number,
): PrimaryFocus {
  const crisisFocus: PrimaryFocus = {
    ...getCrisisRiskCopy(),
    route: '/crisis-mode',
    label: 'PRIORITY',
    accentColor: '#EF5350',
    borderColor: 'rgba(239,83,80,0.3)',
    iconBgColor: 'rgba(239,83,80,0.15)',
  };
  const elevatedFocus: PrimaryFocus = {
    ...getElevatedRiskCopy(),
    route: '/crisis-mode',
    label: 'STAY GROUNDED',
    accentColor: '#FF9800',
    borderColor: 'rgba(255,152,0,0.25)',
    iconBgColor: 'rgba(255,152,0,0.12)',
  };

  if (riskLevel === 'high' || riskLevel === 'crisis') return crisisFocus;
  if (riskLevel === 'elevated') return elevatedFocus;

  const morningTheme = {
    label: 'MORNING',
    accentColor: '#E6A23C',
    borderColor: 'rgba(230,162,60,0.28)',
    iconBgColor: 'rgba(230,162,60,0.14)',
  };
  const afternoonTheme = {
    label: 'AFTERNOON',
    accentColor: Colors.primary,
    borderColor: 'rgba(46,196,182,0.25)',
    iconBgColor: 'rgba(46,196,182,0.12)',
  };
  const eveningTheme = {
    label: 'EVENING',
    accentColor: '#7C8CF8',
    borderColor: 'rgba(124,140,248,0.25)',
    iconBgColor: 'rgba(124,140,248,0.14)',
  };

  if (period === 'morning') {
    if (!hasMorningCheckIn) {
      return {
        ...morningTheme,
        title: 'Morning Check-In',
        description: 'A quick scan sets your protection for the day. Mood, cravings, sleep — we use it to keep you safe.',
        action: 'Start Morning Check-In',
        route: '/daily-checkin',
      };
    }
    if (!hasPledge) {
      return {
        ...morningTheme,
        title: "Today's Pledge",
        description: "Set your intention for the day. A short pledge reinforces your commitment and keeps your streak alive.",
        action: "I'll Take the Pledge",
        route: '/(tabs)/pledges',
      };
    }
    return {
      ...morningTheme,
      title: 'Capture the Moment',
      description: "You're set for the morning. A few lines in your journal can turn insight into lasting growth.",
      action: 'Open Journal',
      route: '/(tabs)/journal',
    };
  }

  if (period === 'afternoon') {
    if (!hasAfternoonCheckIn) {
      return {
        ...afternoonTheme,
        title: 'Afternoon Check-In',
        description: "Midday pulse check. How are cravings, stress, and mood? It only takes a minute.",
        action: 'Start Afternoon Check-In',
        route: '/daily-checkin',
      };
    }
    if (!hasPledge) {
      return {
        ...afternoonTheme,
        title: "Today's Pledge",
        description: "You haven't taken today's pledge yet. Lock in your intention and protect your streak.",
        action: "I'll Take the Pledge",
        route: '/(tabs)/pledges',
      };
    }
    return {
      ...afternoonTheme,
      title: 'Steady Progress',
      description: "You're on track. A quick journal entry can help you notice what's working.",
      action: 'Open Journal',
      route: '/(tabs)/journal',
    };
  }

  // evening
  if (!hasEveningCheckIn) {
    return {
      ...eveningTheme,
      title: 'Evening Check-In',
      description: "Close the loop. Rate your day — mood, cravings, stress — so your protection stays accurate.",
      action: 'Start Evening Check-In',
      route: '/daily-checkin',
    };
  }
  return {
    ...eveningTheme,
    title: 'Wind Down + Reflect',
    description: "Day's done. A short reflection or journal entry helps you process and sleep better.",
    action: 'Reflect in Journal',
    route: '/(tabs)/journal',
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    profile,
    daysSober,
    currentStreak,
    isLoading,
    todayCheckIn,
    todayCheckIns,
    todayPledge,
    checkIns,
    stabilityScore,
  } = useRecovery();
  const { hasFeature } = useSubscription();

  const riskLevel = useMemo(() => getRiskLevel(checkIns, daysSober), [checkIns, daysSober]);
  const period = useMemo(() => getTimeOfDay(), []);
  const greeting = useMemo(() => getGreeting(period), [period]);
  const greetingSubtext = useMemo(() => getGreetingSubtext(period), [period]);

  const hasMorningCheckIn = useMemo(() => todayCheckIns.some(c => c.timeOfDay === 'morning'), [todayCheckIns]);
  const hasAfternoonCheckIn = useMemo(() => todayCheckIns.some(c => c.timeOfDay === 'afternoon'), [todayCheckIns]);
  const hasEveningCheckIn = useMemo(() => todayCheckIns.some(c => c.timeOfDay === 'evening'), [todayCheckIns]);

  const displayScore = useMemo(() => {
    if (todayCheckIn) return todayCheckIn.stabilityScore;
    return stabilityScore;
  }, [todayCheckIn, stabilityScore]);

  const primaryFocus = useMemo(
    () => getPrimaryFocus(
      period,
      hasMorningCheckIn,
      hasAfternoonCheckIn,
      hasEveningCheckIn,
      !!todayPledge,
      riskLevel,
      displayScore,
      daysSober,
    ),
    [period, hasMorningCheckIn, hasAfternoonCheckIn, hasEveningCheckIn, todayPledge, riskLevel, displayScore, daysSober],
  );

  const PeriodIcon = period === 'morning' ? Sun : period === 'afternoon' ? Sunset : Moon;

  const emotionalState = useMemo(() => getEmotionalState(displayScore), [displayScore]);

  const pulseLine = useMemo(() => {
    if (todayCheckIn) {
      return `${emotionalState.emoji} Checked in · ${emotionalState.label}`;
    }
    return '— Not checked in yet · Check in to see your pulse';
  }, [todayCheckIn, emotionalState]);

  if (isLoading) {
    return <HomeLoadingSkeleton />;
  }

  if (!profile.hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as any} />;
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + 72 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting header + minimal stats (day count + streak only) */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {profile.name || 'Friend'}
          </Text>
          <Text style={styles.greetingSubtext}>{greetingSubtext}</Text>
          <Text style={styles.stats}>
            {daysSober} days protected · {currentStreak} day streak
          </Text>
        </View>

        {/* 2. ONE contextual primary action card */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryCard,
            {
              borderColor: primaryFocus.borderColor,
            },
            pressed && styles.primaryCardPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(primaryFocus.route as any);
          }}
          testID="today-focus-action"
        >
          <View style={styles.primaryCardHeader}>
            <View style={[styles.primaryCardIconBg, { backgroundColor: primaryFocus.iconBgColor }]}>
              <PeriodIcon size={20} color={primaryFocus.accentColor} />
            </View>
            <Text style={[styles.primaryCardLabel, { color: primaryFocus.accentColor }]}>{primaryFocus.label}</Text>
          </View>
          <Text style={styles.primaryCardTitle}>{primaryFocus.title}</Text>
          <Text style={styles.primaryCardDesc}>{primaryFocus.description}</Text>
          <View style={[styles.primaryCardBtn, { backgroundColor: primaryFocus.accentColor }]}>
            <Text style={styles.primaryCardBtnText}>{primaryFocus.action}</Text>
            <ArrowRight size={18} color={Colors.white} />
          </View>
        </Pressable>

        {/* 3. Two secondary quick-action buttons: Companion + Journal */}
        <View style={styles.quickActionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionBtn,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (hasFeature('ai_companion')) {
                router.push('/companion-chat' as any);
              } else {
                router.push('/premium-upgrade' as any);
              }
            }}
            testID="companion-chat-cta"
          >
            <MessageCircle size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Companion</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionBtn,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/journal' as any);
            }}
            testID="journal-exercises-cta"
          >
            <BookOpen size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Journal</Text>
          </Pressable>
        </View>

        {/* 4. Collapsed Today's Pulse (emoji/words, no numerical meters) */}
        <View style={styles.pulseCard}>
          <View style={styles.pulseHeader}>
            <Sparkles size={14} color={Colors.textMuted} />
            <Text style={styles.pulseLabel}>Today's Pulse</Text>
          </View>
          <Text style={styles.pulseLine}>{pulseLine}</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/progress' as any)}
            hitSlop={8}
          >
            <Text style={styles.pulseLink}>See full journey →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  stats: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  primaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  primaryCardPressed: {
    opacity: 0.95,
  },
  primaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryCardIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(46,196,182,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
  primaryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  primaryCardDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryCardBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionPressed: {
    opacity: 0.9,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  pulseCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pulseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  pulseLine: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
  pulseLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
