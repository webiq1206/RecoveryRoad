import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Plus, Target, Trash2 } from 'lucide-react-native';

import type { GoalStep, PurposeGoal } from '../../../../types';

export function RebuildGoalsSection(props: {
  goals: PurposeGoal[];
  goalCategories: { key: PurposeGoal['category']; label: string; icon: React.ReactNode }[];
  expandedGoalId: string | null;
  onToggleExpanded: (goalId: string | null) => void;
  onOpenAddGoal: () => void;
  onToggleGoalStep: (goal: PurposeGoal, stepId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  Colors: any;
  styles: any;
}) {
  const {
    goals,
    goalCategories,
    expandedGoalId,
    onToggleExpanded,
    onOpenAddGoal,
    onToggleGoalStep,
    onDeleteGoal,
    Colors,
    styles,
  } = props;

  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Purpose Goals</Text>
          <Text style={styles.sectionSubtitle}>What are you building toward?</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onOpenAddGoal} activeOpacity={0.7}>
          <Plus size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Target size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No goals yet</Text>
          <Text style={styles.emptySubtext}>Give your recovery a destination</Text>
        </View>
      ) : (
        goals.map((goal) => {
          const isExpanded = expandedGoalId === goal.id;
          const catInfo = goalCategories.find((c) => c.key === goal.category);
          return (
            <View key={goal.id} style={[styles.goalCard, goal.isCompleted && styles.goalCardDone]}>
              <TouchableOpacity
                style={styles.goalHeader}
                onPress={() => onToggleExpanded(isExpanded ? null : goal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.goalTitleRow}>
                  <View style={styles.goalCategoryBadge}>{catInfo?.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, goal.isCompleted && styles.goalTitleDone]}>{goal.title}</Text>
                    {goal.description ? (
                      <Text style={styles.goalDesc} numberOfLines={isExpanded ? undefined : 1}>
                        {goal.description}
                      </Text>
                    ) : null}
                  </View>
                  {isExpanded ? <ChevronUp size={18} color={Colors.textMuted} /> : <ChevronDown size={18} color={Colors.textMuted} />}
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${goal.progress}%` },
                        goal.isCompleted && styles.progressBarFillDone,
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{goal.progress}%</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.goalSteps}>
                  {goal.milestoneSteps.map((step: GoalStep) => (
                    <TouchableOpacity
                      key={step.id}
                      style={styles.stepItem}
                      onPress={() => onToggleGoalStep(goal, step.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.stepCheck, step.isCompleted && styles.stepCheckDone]}>
                        {step.isCompleted && <Check size={10} color={Colors.background} />}
                      </View>
                      <Text style={[styles.stepText, step.isCompleted && styles.stepTextDone]}>{step.title}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => onDeleteGoal(goal.id)} style={styles.deleteGoalBtn} activeOpacity={0.7}>
                    <Trash2 size={14} color={Colors.danger} />
                    <Text style={styles.deleteGoalText}>Remove goal</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

