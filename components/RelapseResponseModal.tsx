import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Heart, Shield, Target, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export interface RelapseResponseModalProps {
  visible: boolean;
  onDismiss: () => void;
  onContinueToStabilityBuilder?: () => void;
  onCompleteEveningCheckIn?: () => void;
  onActivateSupport?: () => void;
  onIdentifyTriggerWindow?: () => void;
}

const TITLE = "Today was hard. You're still building.";
const MESSAGE = "One event doesn't erase your progress. Let's strengthen your system.";

export default function RelapseResponseModal({
  visible,
  onDismiss,
  onContinueToStabilityBuilder,
  onCompleteEveningCheckIn,
  onActivateSupport,
  onIdentifyTriggerWindow,
}: RelapseResponseModalProps) {
  const handleAction = (fn: (() => void) | undefined) => {
    if (fn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fn();
    }
    onDismiss();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinueToStabilityBuilder?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{TITLE}</Text>
          <Text style={styles.message}>{MESSAGE}</Text>

          <View style={styles.actions}>
            {onCompleteEveningCheckIn != null && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={() => handleAction(onCompleteEveningCheckIn)}
                testID="relapse-modal-evening-checkin"
              >
                <Heart size={20} color={Colors.primary} />
                <Text style={styles.actionLabel}>Complete Evening Check-In</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            )}
            {onActivateSupport != null && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={() => handleAction(onActivateSupport)}
                testID="relapse-modal-activate-support"
              >
                <Shield size={20} color={Colors.primary} />
                <Text style={styles.actionLabel}>Activate Support</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            )}
            {onIdentifyTriggerWindow != null && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={() => handleAction(onIdentifyTriggerWindow)}
                testID="relapse-modal-identify-trigger"
              >
                <Target size={20} color={Colors.primary} />
                <Text style={styles.actionLabel}>Identify trigger window</Text>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.9 }]}
            onPress={handleContinue}
            testID="relapse-modal-continue"
          >
            <Text style={styles.continueBtnText}>Continue to Stability Builder</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
