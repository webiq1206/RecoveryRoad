import React from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';

export function RebuildEncouragementToast(props: {
  message: string;
  fade: Animated.Value;
  onDismiss: () => void;
  Colors: any;
  styles: any;
}) {
  const { message, fade, onDismiss, Colors, styles } = props;
  if (!message) return null;

  return (
    <Animated.View style={[styles.encouragementToast, { opacity: fade }]}>
      <Sparkles size={14} color={Colors.primary} />
      <Text style={styles.encouragementText}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        hitSlop={12}
        style={({ pressed }) => [styles.encouragementCloseBtn, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Close message"
        testID="rebuild-encouragement-dismiss"
      >
        <X size={18} color={Colors.textMuted} strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

