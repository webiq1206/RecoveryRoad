import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Modal, Platform } from 'react-native';
import { ShieldAlert, Anchor, Hammer, Trophy, ArrowUp, ArrowDown, ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/colors';
import { StageTransition, StageConfig, RecoveryStage } from '../types';

interface StageTransitionModalProps {
  visible: boolean;
  transition: StageTransition | null;
  stageConfigs: Record<RecoveryStage, StageConfig>;
  isProgressing: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

const STAGE_ORDER: RecoveryStage[] = ['crisis', 'stabilize', 'rebuild', 'maintain'];

function getStageIcon(stage: RecoveryStage, color: string, size: number) {
  switch (stage) {
    case 'crisis': return <ShieldAlert size={size} color={color} />;
    case 'stabilize': return <Anchor size={size} color={color} />;
    case 'rebuild': return <Hammer size={size} color={color} />;
    case 'maintain': return <Trophy size={size} color={color} />;
  }
}

const StageTransitionModal = React.memo(({ visible, transition, stageConfigs, isProgressing, onAccept, onDismiss }: StageTransitionModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        isProgressing
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible]);

  const toConfig = useMemo(() => {
    if (!transition) return null;
    return stageConfigs[transition.toStage];
  }, [transition, stageConfigs]);

  const fromConfig = useMemo(() => {
    if (!transition) return null;
    return stageConfigs[transition.fromStage];
  }, [transition, stageConfigs]);

  if (!transition || !toConfig || !fromConfig) return null;

  const positiveSignals = transition.signals.filter(s => s.direction === 'positive');
  const negativeSignals = transition.signals.filter(s => s.direction === 'negative');

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }, { scale: pulseAnim }] }]}>
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={12}>
            <X size={18} color={Colors.textMuted} />
          </Pressable>

          <View style={[styles.iconCircle, { backgroundColor: toConfig.accentColor + '18' }]}>
            {getStageIcon(transition.toStage, toConfig.accentColor, 32)}
          </View>

          <Text style={styles.heading}>
            {isProgressing ? 'You\'re Moving Forward' : 'Adjusting Your Support'}
          </Text>

          <View style={styles.stageFlow}>
            <View style={styles.stageFlowItem}>
              <View style={[styles.stageDot, { backgroundColor: fromConfig.accentColor }]} />
              <Text style={styles.stageFlowLabel}>{fromConfig.label}</Text>
            </View>
            <View style={[styles.arrowWrap, { backgroundColor: isProgressing ? 'rgba(76,175,80,0.12)' : 'rgba(255,179,71,0.12)' }]}>
              {isProgressing
                ? <ArrowUp size={16} color="#4CAF50" />
                : <ArrowDown size={16} color="#FFB347" />
              }
            </View>
            <View style={styles.stageFlowItem}>
              <View style={[styles.stageDot, { backgroundColor: toConfig.accentColor }]} />
              <Text style={[styles.stageFlowLabel, { color: toConfig.accentColor, fontWeight: '700' as const }]}>{toConfig.label}</Text>
            </View>
          </View>

          <Text style={styles.message}>{toConfig.transitionMessage}</Text>

          <Text style={styles.reason}>{transition.reason}</Text>

          {positiveSignals.length > 0 && (
            <View style={styles.signalsSection}>
              <Text style={styles.signalsTitle}>What's going well</Text>
              {positiveSignals.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.signalRow}>
                  <View style={[styles.signalDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.signalText}>{s.factor}: {s.value}</Text>
                </View>
              ))}
            </View>
          )}

          {negativeSignals.length > 0 && !isProgressing && (
            <View style={styles.signalsSection}>
              <Text style={styles.signalsTitle}>Areas needing support</Text>
              {negativeSignals.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.signalRow}>
                  <View style={[styles.signalDot, { backgroundColor: '#FFB347' }]} />
                  <Text style={styles.signalText}>{s.factor}: {s.value}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.whatChanges}>
            <Text style={styles.whatChangesTitle}>What changes</Text>
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Support level</Text>
              <Text style={styles.changeValue}>{toConfig.supportFrequency}</Text>
            </View>
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Companion tone</Text>
              <Text style={styles.changeValue}>{toConfig.aiTone}</Text>
            </View>
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Interventions</Text>
              <Text style={styles.changeValue}>{toConfig.interventionTiming.replace('_', ' ')}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.acceptBtn, { backgroundColor: toConfig.accentColor }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAccept();
            }}
            testID="accept-stage-transition"
          >
            <Text style={styles.acceptBtnText}>
              {isProgressing ? 'Move Forward' : 'Get More Support'}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
            onPress={onDismiss}
            testID="dismiss-stage-transition"
          >
            <Text style={styles.dismissBtnText}>Stay in {fromConfig.label}</Text>
          </Pressable>

          <Text style={styles.reassurance}>
            This is a suggestion, not a judgment. You're always in control.
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stageFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stageFlowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageFlowLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  reason: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  signalsSection: {
    width: '100%',
    marginBottom: 14,
  },
  signalsTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  whatChanges: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  whatChangesTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  changeValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 10,
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  dismissBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dismissBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  reassurance: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default StageTransitionModal;
