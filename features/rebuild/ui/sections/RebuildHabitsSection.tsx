import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Check, Flame, Plus, RefreshCw, Trash2 } from 'lucide-react-native';

import type { ReplacementHabit } from '../../../../types';

export function RebuildHabitsSection(props: {
  rebuildHabits: ReplacementHabit[];
  habitCategories: { key: ReplacementHabit['category']; label: string; icon: React.ReactNode }[];
  isHabitDoneToday: (habit: ReplacementHabit) => boolean;
  onOpenAddHabit: () => void;
  onCompleteHabit: (habit: ReplacementHabit) => void;
  onDeleteHabit: (habitId: string) => void;
  Colors: any;
  styles: any;
}) {
  const {
    rebuildHabits,
    habitCategories,
    isHabitDoneToday,
    onOpenAddHabit,
    onCompleteHabit,
    onDeleteHabit,
    Colors,
    styles,
  } = props;

  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Habit Replacements</Text>
          <Text style={styles.sectionSubtitle}>Replace old triggers with new patterns</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onOpenAddHabit} activeOpacity={0.7}>
          <Plus size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {rebuildHabits.length === 0 ? (
        <View style={styles.emptyState}>
          <RefreshCw size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No habit replacements yet</Text>
          <Text style={styles.emptySubtext}>When a craving hits, what will you do instead?</Text>
        </View>
      ) : (
        rebuildHabits.map((habit) => {
          const done = isHabitDoneToday(habit);
          const catInfo = habitCategories.find((c) => c.key === habit.category);
          return (
            <View key={habit.id} style={[styles.habitCard, done && styles.habitCardDone]}>
              <View style={styles.habitTop}>
                <View style={styles.habitCategoryBadge}>
                  {catInfo?.icon}
                  <Text style={styles.habitCategoryText}>{catInfo?.label}</Text>
                </View>
                {habit.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Flame size={12} color="#FF6B35" />
                    <Text style={styles.streakText}>{habit.streak}d</Text>
                  </View>
                )}
              </View>
              <View style={styles.habitFlow}>
                <View style={styles.habitTriggerBox}>
                  <Text style={styles.habitTriggerLabel}>When I feel</Text>
                  <Text style={styles.habitTriggerText}>{habit.oldTrigger}</Text>
                </View>
                <ArrowRight size={16} color={Colors.primary} style={{ marginHorizontal: 8 }} />
                <View style={styles.habitReplacementBox}>
                  <Text style={styles.habitReplacementLabel}>I will</Text>
                  <Text style={styles.habitReplacementText}>{habit.newHabit}</Text>
                </View>
              </View>
              <View style={styles.habitActions}>
                <TouchableOpacity
                  style={[styles.completeBtn, done && styles.completeBtnDone]}
                  onPress={() => onCompleteHabit(habit)}
                  disabled={done}
                  activeOpacity={0.7}
                >
                  <Check size={14} color={done ? Colors.textMuted : Colors.text} />
                  <Text style={[styles.completeBtnText, done && styles.completeBtnTextDone]}>{done ? 'Done today' : 'Mark done'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteHabit(habit.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Trash2 size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

