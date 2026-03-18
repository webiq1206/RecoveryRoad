import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';

export function CrisisBreathingStep(props: {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  breathPhase: 'in' | 'hold' | 'out';
  breathTimer: number;
  breathCount: number;
  breathCircleAnim: Animated.Value;
  breathColor: string;
  onContinue: () => void;
}) {
  const {
    fadeAnim,
    slideAnim,
    breathPhase,
    breathTimer,
    breathCount,
    breathCircleAnim,
    breathColor,
    onContinue,
  } = props;

  const breathLabel = breathPhase === 'in' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold' : 'Breathe Out';

  return (
    <Animated.View style={[crisisStyles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={crisisStyles.stepLabel}>Breathe</Text>
      <Text style={crisisStyles.stepHint}>Follow the circle</Text>

      <View style={crisisStyles.breathWrapper}>
        <Animated.View
          style={[
            crisisStyles.breathCircle,
            {
              borderColor: breathColor,
              transform: [{ scale: breathCircleAnim }],
            },
          ]}
        >
          <Text style={[crisisStyles.breathPhaseText, { color: breathColor }]}>{breathLabel}</Text>
          <Text style={crisisStyles.breathTimerText}>{breathTimer}</Text>
        </Animated.View>
      </View>

      <Text style={crisisStyles.breathCountText}>Cycle {breathCount + 1}</Text>

      <Pressable
        style={({ pressed }) => [crisisStyles.continueBtn, pressed && { opacity: 0.7 }]}
        onPress={onContinue}
        testID="crisis-skip-breathing"
      >
        <Text style={crisisStyles.continueBtnText}>Continue</Text>
        <ChevronRight size={20} color={CRISIS_COLORS.MUTED} />
      </Pressable>
    </Animated.View>
  );
}

