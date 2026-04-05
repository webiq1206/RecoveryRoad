import React from 'react';
import { Pressable, View } from 'react-native';
import { Brain, Eye, Phone, Timer, Wind } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';
import type { ToolId } from '../../tools/types';

function getStepIcon(step: ToolId) {
  switch (step) {
    case 'breathing':
      return Wind;
    case 'grounding':
      return Eye;
    case 'urge-timer':
      return Timer;
    case 'reset':
      return Brain;
    case 'connect':
      return Phone;
    default:
      return Phone;
  }
}

export function CrisisStepNav(props: {
  steps: ToolId[];
  currentStep: ToolId;
  stepIndex: number;
  onGoToStep: (step: ToolId) => void;
}) {
  const { steps, currentStep, stepIndex, onGoToStep } = props;

  return (
    <View style={crisisStyles.stepNav}>
      {steps.map((step) => {
        const isActive = step === currentStep;
        const isDone = steps.indexOf(step) < stepIndex;
        const StepIcon = getStepIcon(step);

        return (
          <Pressable
            key={step}
            style={[crisisStyles.stepNavItem, isActive && crisisStyles.stepNavItemActive]}
            onPress={() => onGoToStep(step)}
            hitSlop={8}
            testID={`crisis-nav-${step}`}
          >
            <StepIcon size={18} color={isActive ? CRISIS_COLORS.ACCENT : isDone ? CRISIS_COLORS.ACCENT + '80' : CRISIS_COLORS.MUTED} />
          </Pressable>
        );
      })}
    </View>
  );
}

