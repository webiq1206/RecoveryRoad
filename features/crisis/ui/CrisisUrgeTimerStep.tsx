import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ChevronRight, RotateCcw, Timer } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CrisisUrgeTimerStep(props: {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  pulseAnim: Animated.Value;
  urgeSeconds: number;
  urgeRunning: boolean;
  onStart: () => void;
  onReset: () => void;
  onContinue: () => void;
}) {
  const { fadeAnim, slideAnim, pulseAnim, urgeSeconds, urgeRunning, onStart, onReset, onContinue } = props;
  const progress = Math.min(urgeSeconds / 600, 1);

  return (
    <Animated.View style={[crisisStyles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={crisisStyles.stepLabel}>Ride the Wave</Text>
      <Text style={crisisStyles.stepHint}>Cravings peak then fade</Text>

      <Animated.View style={[crisisStyles.urgeTimerCircle, { transform: [{ scale: urgeRunning ? pulseAnim : 1 }] }]}>
        <Text style={crisisStyles.urgeTimerText}>{formatTime(urgeSeconds)}</Text>
        <Text style={crisisStyles.urgeTimerLabel}>
          {urgeSeconds < 60 ? 'Stay with it' : urgeSeconds < 300 ? "You're doing great" : 'Almost through'}
        </Text>
      </Animated.View>

      <View style={crisisStyles.urgeProgressBar}>
        <View style={[crisisStyles.urgeProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={crisisStyles.urgeProgressLabel}>Most urges fade within 10-15 minutes</Text>

      {!urgeRunning ? (
        <Pressable
          style={({ pressed }) => [crisisStyles.bigButton, pressed && crisisStyles.bigButtonPressed]}
          onPress={onStart}
          testID="crisis-start-timer"
        >
          <Timer size={24} color="#FFFFFF" />
          <Text style={crisisStyles.bigButtonText}>Start Timer</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [crisisStyles.bigButton, { backgroundColor: CRISIS_COLORS.BORDER }, pressed && { opacity: 0.8 }]}
          onPress={onReset}
          testID="crisis-reset-timer"
        >
          <RotateCcw size={22} color={CRISIS_COLORS.TXT} />
          <Text style={[crisisStyles.bigButtonText, { color: CRISIS_COLORS.TXT }]}>Reset</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [crisisStyles.continueBtn, pressed && { opacity: 0.7 }]}
        onPress={onContinue}
        testID="crisis-skip-timer"
      >
        <Text style={crisisStyles.continueBtnText}>Continue</Text>
        <ChevronRight size={20} color={CRISIS_COLORS.MUTED} />
      </Pressable>
    </Animated.View>
  );
}

