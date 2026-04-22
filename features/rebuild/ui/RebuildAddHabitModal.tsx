import React from 'react';
import { Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import type { ReplacementHabit } from '../../../types';
import { RebuildModalTopFrame } from './RebuildModalTopFrame';
import { useRebuildModalMaxScrollHeight } from './useRebuildModalMaxScrollHeight';

export function RebuildAddHabitModal(props: {
  visible: boolean;
  newHabitTrigger: string;
  setNewHabitTrigger: (v: string) => void;
  newHabitReplacement: string;
  setNewHabitReplacement: (v: string) => void;
  newHabitCategory: ReplacementHabit['category'];
  setNewHabitCategory: (c: ReplacementHabit['category']) => void;
  habitCategories: { key: ReplacementHabit['category']; label: string; icon: React.ReactNode }[];
  onClose: () => void;
  onAdd: () => void;
  Colors: any;
  styles: any;
}) {
  const {
    visible,
    newHabitTrigger,
    setNewHabitTrigger,
    newHabitReplacement,
    setNewHabitReplacement,
    newHabitCategory,
    setNewHabitCategory,
    habitCategories,
    onClose,
    onAdd,
    Colors,
    styles,
  } = props;

  const insets = useSafeAreaInsets();
  const maxScrollH = useRebuildModalMaxScrollHeight();
  const modalBottomPad = (Platform.OS === 'ios' ? 24 : 16) + insets.bottom;
  const canAdd = newHabitTrigger.trim().length > 0 && newHabitReplacement.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <RebuildModalTopFrame>
        <ScrollView
          style={[styles.modalScroll, { maxHeight: maxScrollH }]}
          contentContainerStyle={[styles.modalScrollContent, { paddingBottom: modalBottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          bounces={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit Replacement</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>When I feel the urge to...</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. drink, scroll, isolate..."
              placeholderTextColor={Colors.textMuted}
              value={newHabitTrigger}
              onChangeText={setNewHabitTrigger}
            />

            <Text style={styles.inputLabel}>Instead, I will...</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. go for a walk, call a friend..."
              placeholderTextColor={Colors.textMuted}
              value={newHabitReplacement}
              onChangeText={setNewHabitReplacement}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {habitCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, newHabitCategory === cat.key && styles.categoryChipActive]}
                  onPress={() => setNewHabitCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  {cat.icon}
                  <Text style={[styles.categoryChipText, newHabitCategory === cat.key && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, !canAdd && styles.saveButtonDisabled]}
              onPress={onAdd}
              disabled={!canAdd}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Add Replacement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </RebuildModalTopFrame>
    </Modal>
  );
}
