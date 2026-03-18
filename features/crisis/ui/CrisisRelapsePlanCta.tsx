import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';

export function CrisisRelapsePlanCta(props: { onPress: () => void }) {
  const { onPress } = props;

  return (
    <Pressable
      style={({ pressed }) => [crisisStyles.relapsePlanBar, pressed && { opacity: 0.9 }]}
      onPress={onPress}
      testID="crisis-relapse-plan-cta"
    >
      <View style={crisisStyles.relapsePlanDot} />
      <View style={{ flex: 1 }}>
        <Text style={crisisStyles.relapsePlanTitle}>Open your Relapse Plan</Text>
        <Text style={crisisStyles.relapsePlanSubtitle}>
          Re-center on your warning signs, coping strategies, and support contacts while you use these tools.
        </Text>
      </View>
      <ChevronRight size={16} color={CRISIS_COLORS.MUTED} />
    </Pressable>
  );
}

