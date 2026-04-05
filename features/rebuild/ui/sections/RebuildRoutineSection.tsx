import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Check, Plus, Sunrise, Trash2 } from 'lucide-react-native';

import type { RoutineBlock } from '../../../../types';

export function RebuildRoutineSection(props: {
  routines: RoutineBlock[];
  routinesByTime: Record<RoutineBlock['time'], RoutineBlock[]>;
  timeOptions: { key: RoutineBlock['time']; label: string; icon: React.ReactNode }[];
  onOpenAddRoutine: () => void;
  onToggleRoutine: (block: RoutineBlock) => void;
  onDeleteRoutine: (blockId: string) => void;
  Colors: any;
  styles: any;
}) {
  const { routines, routinesByTime, timeOptions, onOpenAddRoutine, onToggleRoutine, onDeleteRoutine, Colors, styles } = props;

  return (
    <View style={styles.sectionContent}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Daily Routine</Text>
          <Text style={styles.sectionSubtitle}>Structure builds stability</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onOpenAddRoutine} activeOpacity={0.7}>
          <Plus size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {routines.length === 0 ? (
        <View style={styles.emptyState}>
          <Sunrise size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No routines set</Text>
          <Text style={styles.emptySubtext}>Build a daily rhythm that keeps you grounded</Text>
        </View>
      ) : (
        timeOptions.map((timeOpt) => {
          const blocks = routinesByTime[timeOpt.key];
          if (blocks.length === 0) return null;
          return (
            <View key={timeOpt.key} style={styles.timeGroup}>
              <View style={styles.timeHeader}>
                {timeOpt.icon}
                <Text style={styles.timeLabel}>{timeOpt.label}</Text>
              </View>
              {blocks.map((block) => (
                <TouchableOpacity
                  key={block.id}
                  style={[styles.routineItem, block.isCompleted && styles.routineItemDone]}
                  onPress={() => onToggleRoutine(block)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.routineCheck, block.isCompleted && styles.routineCheckDone]}>
                    {block.isCompleted && <Check size={12} color={Colors.background} />}
                  </View>
                  <View style={styles.routineInfo}>
                    <Text style={[styles.routineTitle, block.isCompleted && styles.routineTitleDone]}>{block.title}</Text>
                    {block.description ? <Text style={styles.routineDesc}>{block.description}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => onDeleteRoutine(block.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                    <Trash2 size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          );
        })
      )}
    </View>
  );
}

