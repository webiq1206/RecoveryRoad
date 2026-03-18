import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { crisisStyles, CRISIS_COLORS } from './styles';

export function CrisisCompanionBar(props: {
  companionFade: Animated.Value;
  message: string;
  onPress: () => void;
}) {
  const { companionFade, message, onPress } = props;

  return (
    <Animated.View style={[crisisStyles.companionBar, { opacity: companionFade }]}>
      <Pressable
        style={({ pressed }) => [crisisStyles.companionBarInner, pressed && { opacity: 0.85 }]}
        onPress={onPress}
        testID="crisis-companion-btn"
      >
        <View style={crisisStyles.companionBarDot} />
        <Text style={crisisStyles.companionBarText} numberOfLines={2}>
          {message}
        </Text>
        <ChevronRight size={16} color={CRISIS_COLORS.MUTED} />
      </Pressable>
    </Animated.View>
  );
}

