import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ArrowRight, Brain } from 'lucide-react-native';

import { RESET_PROMPTS } from './constants';
import { crisisStyles, CRISIS_COLORS } from './styles';

export function CrisisResetStep(props: {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  resetIndex: number;
  onNext: () => void;
}) {
  const { fadeAnim, slideAnim, resetIndex, onNext } = props;

  return (
    <Animated.View style={[crisisStyles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={crisisStyles.stepLabel}>Reset</Text>
      <Text style={crisisStyles.stepHint}>Read slowly. Let each word sink in.</Text>

      <View style={crisisStyles.resetCard}>
        <Brain size={32} color={CRISIS_COLORS.ACCENT} style={{ marginBottom: 20 }} />
        <Text style={crisisStyles.resetPrompt}>{RESET_PROMPTS[resetIndex]}</Text>
      </View>

      <Text style={crisisStyles.resetCounter}>
        {resetIndex + 1} of {RESET_PROMPTS.length}
      </Text>

      <Pressable
        style={({ pressed }) => [crisisStyles.bigButton, pressed && crisisStyles.bigButtonPressed]}
        onPress={onNext}
        testID="crisis-next-reset"
      >
        <Text style={crisisStyles.bigButtonText}>{resetIndex < RESET_PROMPTS.length - 1 ? 'Next' : 'Continue'}</Text>
        <ArrowRight size={24} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

