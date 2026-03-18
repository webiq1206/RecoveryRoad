import React from 'react';
import { Animated, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';

export function RebuildEncouragementToast(props: {
  message: string;
  fade: Animated.Value;
  Colors: any;
  styles: any;
}) {
  const { message, fade, Colors, styles } = props;
  if (!message) return null;

  return (
    <Animated.View style={[styles.encouragementToast, { opacity: fade }]}>
      <Sparkles size={14} color={Colors.primary} />
      <Text style={styles.encouragementText}>{message}</Text>
    </Animated.View>
  );
}

