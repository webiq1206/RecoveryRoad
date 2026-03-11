import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import {
  ArrowRight,
  Sun,
  AlertTriangle,
  Users,
  PhoneCall,
  Heart,
  Brain,
  BookOpenCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRecovery } from '@/providers/RecoveryProvider';
import { useRiskPrediction } from '@/providers/RiskPredictionProvider';
import { HomeLoadingSkeleton } from '@/components/LoadingSkeleton';
import { RecoveryStabilityPanel } from '@/components/RecoveryStabilityPanel';
import { calculateStability } from '@/utils/stabilityEngine';
import type { StabilityZoneId } from '@/components/RecoveryStabilityPanel';

type TodayPlanAction = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  emphasis?: 'primary' | 'secondary';
};

type TodayPlan = {
  zoneId: StabilityZoneId;
  actions: TodayPlanAction[];
};

function getStabilityZoneId(score: number): StabilityZoneId {
  if (score >= 70) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 30) return 'orange';
  return 'red';
}

function buildTodayPlan(zoneId: StabilityZoneId): TodayPlan {
  switch (zoneId) {
    case 'green':
      return {
        zoneId,
        actions: [
          {
            id: 'checkin',
            title: 'Daily check-in',
            subtitle: 'Lock in what\'s working today.',
            route: '/daily-checkin',
            icon: Sun,
            emphasis: 'primary',
          },
          {
            id: 'rebuild',
            title: 'One rebuild action',
            subtitle: 'Take one step toward your next milestone.',
            route: '/(tabs)/rebuild',
            icon: BookOpenCheck,
          },
          {
            id: 'connection',
            title: 'Connection touchpoint',
            subtitle: 'Reach out to one safe person or community space.',
            route: '/(tabs)/community',
            icon: Users,
          },
        ],
      };
    case 'yellow':
      return {
        zoneId,
        actions: [
          {
            id: 'checkin',
            title: 'Grounding check-in',
            subtitle: 'Name how you are and what you need.',
            route: '/daily-checkin',
            icon: Sun,
            emphasis: 'primary',
          },
          {
            id: 'coping',
            title: 'Coping exercise',
            subtitle: 'Use a quick grounding practice to settle your system.',
            route: '/crisis-mode',
            icon: Brain,
          },
          {
            id: 'triggers',
            title: 'Trigger review',
            subtitle: 'Plan around one situation that could pull you off track.',
            route: '/(tabs)/triggers',
            icon: AlertTriangle,
          },
        ],
      };
    case 'orange':
      return {
        zoneId,
        actions: [
          {
            id: 'stability-checkin',
            title: 'Stability check-in',
            subtitle: 'Slow down, breathe, and get honest with yourself.',
            route: '/daily-checkin',
            icon: Sun,
            emphasis: 'primary',
          },
          {
            id: 'support',
            title: 'Ask for support',
            subtitle: 'Text or call someone in your support circle.',
            route: '/emergency',
            icon: PhoneCall,
          },
          {
            id: 'crisis-tools',
            title: 'Stability tools',
            subtitle: 'Use grounding and safety tools before urges rise further.',
            route: '/crisis-mode',
            icon: Heart,
          },
        ],
      };
    case 'red':
    default:
      return {
        zoneId: 'red',
        actions: [
          {
            id: 'crisis',
            title: 'Crisis Mode',
            subtitle: 'You are not alone. Go to safety tools now.',
            route: '/crisis-mode',
            icon: AlertTriangle,
            emphasis: 'primary',
          },
          {
            id: 'call-support',
            title: 'Call support contact',
            subtitle: 'Reach out to a trusted person or professional.',
            route: '/emergency',
            icon: PhoneCall,
          },
          {
            id: 'grounding',
            title: 'Grounding exercise',
            subtitle: 'Use a short exercise to ride this wave.',
            route: '/crisis-mode',
            icon: Brain,
          },
        ],
      };
  }
}

export default function TodayHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isLoading, checkIns } = useRecovery();
  const {
    riskCategory,
    riskLabel,
    trendLabel: riskTrendLabel,
  } = useRiskPrediction();

  const stabilityResult = useMemo(() => {
    const rp = profile.recoveryProfile;
    const sorted = [...checkIns].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const previousScores = sorted.slice(0, 7).map(c => c.stabilityScore);
    const today = new Date().toISOString().split('T')[0];
    const dailyActionsCompleted = checkIns.filter(c => c.date === today).length;

    const input = {
      intensity: rp.struggleLevel,
      sleepQuality: (rp.sleepQuality === 'fair'
        ? 'okay'
        : rp.sleepQuality === 'excellent'
          ? 'good'
          : rp.sleepQuality === 'poor'
            ? 'poor'
            : 'good') as 'poor' | 'okay' | 'good',
      triggers: rp.triggers ?? [],
      supportLevel: rp.supportAvailability,
      dailyActionsCompleted,
      relapseLogged: (rp.relapseCount ?? 0) > 0,
    };

    return calculateStability(input, previousScores);
  }, [profile.recoveryProfile, checkIns]);

  const stabilityZoneId = useMemo(
    () => getStabilityZoneId(stabilityResult.score),
    [stabilityResult.score],
  );

  const todayPlan = useMemo(
    () => buildTodayPlan(stabilityZoneId),
    [stabilityZoneId],
  );

  const primaryAction = todayPlan.actions.find(a => a.emphasis === 'primary') ?? todayPlan.actions[0];

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
        <View style={styles.header}>
          <Text style={styles.greetingLabel}>TodayHub</Text>
          <Text style={styles.greetingSubtitle}>
            Your stability, risk, and next best step — all in one place.
          </Text>
        </View>

        {/* Stability + relapse risk panel */}
        <RecoveryStabilityPanel
          score={stabilityResult.score}
          stabilityTrend={stabilityResult.trend}
          relapseRiskCategory={riskCategory}
          relapseRiskLabel={riskLabel}
          relapseRiskTrendLabel={riskTrendLabel || 'Stable'}
        />

        {riskCategory === 'high' && (
          <Pressable
            style={({ pressed }) => [
              styles.relapsePlanCard,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/relapse-plan' as any);
            }}
            testID="todayhub-relapse-plan-cta"
          >
            <View style={styles.relapsePlanIconWrap}>
              <AlertTriangle size={20} color={Colors.danger} />
            </View>
            <View style={styles.relapsePlanTextWrap}>
              <Text style={styles.relapsePlanTitle}>Open your Relapse Plan</Text>
              <Text style={styles.relapsePlanSubtitle}>
                Review warning signs, triggers, and coping strategies while risk is high.
              </Text>
            </View>
            <ArrowRight size={20} color={Colors.danger} />
          </Pressable>
        )}

        {/* Immediate next action */}
        <Text style={styles.sectionLabel}>Immediate next action</Text>
        <Pressable
          style={({ pressed }) => [
            styles.primaryActionCard,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push(primaryAction.route as any);
          }}
          testID="todayhub-primary-action"
        >
          <View style={styles.primaryIconWrap}>
            <primaryAction.icon size={24} color={Colors.primary} />
          </View>
          <View style={styles.primaryTextWrap}>
            <Text style={styles.primaryTitle}>{primaryAction.title}</Text>
            <Text style={styles.primarySubtitle}>{primaryAction.subtitle}</Text>
          </View>
          <ArrowRight size={20} color={Colors.primary} />
        </Pressable>

        {/* Today's Plan */}
        <Text style={styles.planTitle}>Today&apos;s Plan</Text>
        <View style={styles.planCard}>
          {todayPlan.actions.map(action => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.planRow,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(action.route as any);
              }}
              testID={`todayhub-plan-${action.id}`}
            >
              <View style={styles.planIconWrap}>
                <action.icon size={20} color={Colors.primary} />
              </View>
              <View style={styles.planTextWrap}>
                <Text style={styles.planRowTitle}>{action.title}</Text>
                <Text style={styles.planRowSubtitle}>{action.subtitle}</Text>
              </View>
              <ArrowRight size={18} color={Colors.textSecondary} />
            </Pressable>
          ))}
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
    marginBottom: 16,
  },
  greetingLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  primaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.primary + '55',
    marginBottom: 18,
  },
  primaryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  primaryTextWrap: {
    flex: 1,
  },
  primaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  primarySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  planCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.9,
  },
  relapsePlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger + '10',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.danger + '35',
    marginBottom: 18,
  },
  relapsePlanIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  relapsePlanTextWrap: {
    flex: 1,
  },
  relapsePlanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
  },
  relapsePlanSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

