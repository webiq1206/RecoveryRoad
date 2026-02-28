import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import {
  ArrowRight, BookOpen, Sparkles,
  Sun, Sunset, Moon, ShieldAlert, AlertTriangle, TrendingUp, Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRecovery } from '@/providers/RecoveryProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { HomeLoadingSkeleton } from '@/components/LoadingSkeleton';
import { ProtectionScoreCircle } from '@/components/ProtectionScoreCircle';
import { calculateProtectionScore } from '@/utils/protectionScore';
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
    checkIns,
    stabilityScore,
  } = useRecovery();
  const { hasFeature } = useSubscription();

  const { protectionScore, protectionStatus } = useMemo(() => {
    const rp = profile.recoveryProfile;
    const r = calculateProtectionScore({
      intensity: rp.struggleLevel,
      sleepQuality: rp.sleepQuality,
      triggers: rp.triggers ?? [],
      supportLevel: rp.supportAvailability,
    });
    return { protectionScore: r.score, protectionStatus: r.status };
  }, [
    profile.recoveryProfile.struggleLevel,
    profile.recoveryProfile.sleepQuality,
    profile.recoveryProfile.triggers,
    profile.recoveryProfile.supportAvailability,
  ]);
  const showAlertBanner = protectionScore < 40;

  const period = useMemo(() => getTimeOfDay(), []);
  const greeting = useMemo(() => getGreeting(period), [period]);
  const greetingSubtext = useMemo(() => getGreetingSubtext(period), [period]);

  const displayScore = useMemo(() => {
    if (todayCheckIn) return todayCheckIn.stabilityScore;
    return stabilityScore;
  }, [todayCheckIn, stabilityScore]);

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
        {/* Conditional alert banner when protection score is low */}
        {showAlertBanner && (
          <View style={styles.alertBanner}>
            <ShieldAlert size={20} color="#FFF" />
            <Text style={styles.alertBannerText}>
              High alert — your protection needs extra support today. Stay connected and use your tools.
            </Text>
          </View>
        )}

        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {profile.name || 'Friend'}
          </Text>
          <Text style={styles.greetingSubtext}>{greetingSubtext}</Text>
        </View>

        {/* Primary: Protection Score */}
        <View style={styles.scoreSection}>
          <ProtectionScoreCircle
            score={protectionScore}
            status={protectionStatus}
            size={140}
          />
        </View>

        {/* Secondary stats: $ saved, active streak */}
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStatItem}>
            <Text style={styles.secondaryStatValue}>${(profile.dailySavings ?? 0).toFixed(0)}</Text>
            <Text style={styles.secondaryStatLabel}>saved</Text>
          </View>
          <View style={styles.secondaryStatDivider} />
          <View style={styles.secondaryStatItem}>
            <Text style={styles.secondaryStatValue}>{currentStreak}</Text>
            <Text style={styles.secondaryStatLabel}>day streak</Text>
          </View>
        </View>

        {/* Today's Protection Plan — 3 required actions */}
        <Text style={styles.planSectionTitle}>Today's Protection Plan</Text>
        <View style={styles.planCard}>
          <Pressable
            style={({ pressed }) => [styles.planRow, pressed && styles.planRowPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/daily-checkin' as any);
            }}
            testID="plan-checkin"
          >
            <View style={styles.planIconWrap}>
              <Sun size={18} color={Colors.primary} />
            </View>
            <View style={styles.planTextWrap}>
              <Text style={styles.planRowTitle}>
                {period === 'morning' ? 'Morning' : period === 'afternoon' ? 'Afternoon' : 'Evening'} Check-In
              </Text>
              <Text style={styles.planRowSubtitle}>
                Set how you're arriving and one gentle intention.
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.planRow, pressed && styles.planRowPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/triggers' as any);
            }}
            testID="plan-triggers"
          >
            <View style={styles.planIconWrap}>
              <AlertTriangle size={18} color={Colors.primary} />
            </View>
            <View style={styles.planTextWrap}>
              <Text style={styles.planRowTitle}>Trigger Review</Text>
              <Text style={styles.planRowSubtitle}>
                Plan around one situation today.
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.planRow, pressed && styles.planRowPressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/rebuild' as any);
            }}
            testID="plan-rebuild"
          >
            <View style={styles.planIconWrap}>
              <TrendingUp size={18} color={Colors.primary} />
            </View>
            <View style={styles.planTextWrap}>
              <Text style={styles.planRowTitle}>One Rebuild Action</Text>
              <Text style={styles.planRowSubtitle}>
                One small action toward your goal.
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Optional tools: Journal, Crisis Mode, Community */}
        <View style={styles.quickActionsRow}>
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
          <Pressable
            style={({ pressed }) => [
              styles.quickActionBtn,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/crisis-mode' as any);
            }}
            testID="crisis-mode-cta"
          >
            <AlertTriangle size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Crisis Mode</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.quickActionBtn,
              pressed && styles.quickActionPressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/community' as any);
            }}
            testID="community-cta"
          >
            <Users size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Community</Text>
          </Pressable>
        </View>

        {/* Today's Pulse (optional summary) */}
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
    marginBottom: 12,
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EF5350',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  secondaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  secondaryStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  secondaryStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  planSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  planRowPressed: {
    opacity: 0.9,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(46,196,182,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTextWrap: {
    flex: 1,
  },
  planRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  planRowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
