import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Check, ChevronRight, Cookie, Ear, Eye, Flower2, Hand } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';
import { GROUNDING_STEPS } from './constants';

function GroundingIcon({ type, size, color }: { type: string; size: number; color: string }) {
  switch (type) {
    case 'eye':
      return <Eye size={size} color={color} />;
    case 'hand':
      return <Hand size={size} color={color} />;
    case 'ear':
      return <Ear size={size} color={color} />;
    case 'flower':
      return <Flower2 size={size} color={color} />;
    case 'taste':
      return <Cookie size={size} color={color} />;
    default:
      return <Eye size={size} color={color} />;
  }
}

export function CrisisGroundingStep(props: {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  groundingIndex: number;
  groundingChecked: number[];
  onCheck: (idx: number) => void;
  onSkip: () => void;
}) {
  const { fadeAnim, slideAnim, groundingIndex, groundingChecked, onCheck, onSkip } = props;
  const current = GROUNDING_STEPS[groundingIndex];
  const items = Array.from({ length: current.count }, (_, i) => i);

  return (
    <Animated.View style={[crisisStyles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={crisisStyles.stepLabel}>Ground Yourself</Text>
      <Text style={crisisStyles.stepHint}>Focus on your senses</Text>

      <View style={[crisisStyles.groundingIconWrapper, { backgroundColor: current.color + '15' }]}>
        <GroundingIcon type={current.icon} size={40} color={current.color} />
      </View>

      <Text style={[crisisStyles.groundingSense, { color: current.color }]}>{current.sense}</Text>
      <Text style={crisisStyles.groundingPrompt}>{current.prompt}</Text>

      <View style={crisisStyles.groundingChecks}>
        {items.map((i) => {
          const checked = groundingChecked.includes(i);
          return (
            <Pressable
              key={i}
              style={[
                crisisStyles.groundingCheckItem,
                checked && { backgroundColor: current.color + '25', borderColor: current.color },
              ]}
              onPress={() => onCheck(i)}
              testID={`grounding-check-${i}`}
            >
              {checked ? <Check size={28} color={current.color} /> : <Text style={crisisStyles.groundingCheckNum}>{i + 1}</Text>}
            </Pressable>
          );
        })}
      </View>

      <View style={crisisStyles.groundingProgress}>
        {GROUNDING_STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              crisisStyles.groundingDot,
              i === groundingIndex && { backgroundColor: current.color, width: 24 },
              i < groundingIndex && { backgroundColor: CRISIS_COLORS.ACCENT },
            ]}
          />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [crisisStyles.continueBtn, pressed && { opacity: 0.7 }]}
        onPress={onSkip}
        testID="crisis-skip-grounding"
      >
        <Text style={crisisStyles.continueBtnText}>Skip</Text>
        <ChevronRight size={20} color={CRISIS_COLORS.MUTED} />
      </Pressable>
    </Animated.View>
  );
}

