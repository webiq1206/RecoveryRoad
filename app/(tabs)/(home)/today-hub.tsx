import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { ArrowRight, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useTodayHub, type UiTodayPlanAction } from '@/features/home/hooks/useTodayHub';
import { HomeLoadingSkeleton } from '@/components/LoadingSkeleton';
import { RecoveryStabilityPanel } from '@/components/RecoveryStabilityPanel';

export default function TodayHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const vm = useTodayHub();

  if (vm.isLoading) {
    return <HomeLoadingSkeleton />;
  }

  if (vm.shouldRedirectToOnboarding) {
    return <Redirect href={'/onboarding' as any} />;
  }

  const { stability, relapseRisk, todayPlan, primaryAction, showRelapsePlanCta } = vm;

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
          score={stability.score}
          stabilityTrend={stability.trend}
          relapseRiskCategory={relapseRisk.category}
          relapseRiskLabel={relapseRisk.label}
          relapseRiskTrendLabel={relapseRisk.trendLabel}
        />

        {showRelapsePlanCta && (
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
        {primaryAction ? (
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
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>
              We&apos;ll suggest your next steps once you&apos;ve completed a few check-ins.
            </Text>
          </View>
        )}

        {/* Today's Plan */}
        <Text style={styles.planTitle}>Today&apos;s Plan</Text>
        <View style={styles.planCard}>
          {todayPlan.priorityActions.map((action: UiTodayPlanAction) => (
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
              testID={`todayhub-plan-priority-${action.id}`}
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
          {todayPlan.optionalActions.map((action: UiTodayPlanAction) => (
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

        {!!todayPlan.riskWarnings.length && (
          <View style={styles.warningCard}>
            {todayPlan.riskWarnings.map((warning, index) => (
              <View key={index} style={styles.warningRow}>
                <AlertTriangle size={16} color={Colors.danger} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}
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
  emptyStateCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  warningCard: {
    backgroundColor: Colors.danger + '08',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.danger + '35',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
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

