import React, { useCallback } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Colors from '../constants/colors';
import { useKeyboardState } from '../hooks/useKeyboardState';

export interface KeyboardDoneBarProps {
  /**
   * Render in normal flow instead of as an overlay. Use this when the bar is the
   * last child of a KeyboardAvoidingView, which already shrinks its content box to
   * the keyboard — that avoids depending on the view's keyboardVerticalOffset math.
   */
  inline?: boolean;
}

/**
 * "Done" control that sits just above the software keyboard so multiline fields
 * (which have no return key) can still be dismissed.
 *
 * Default (overlay) placement expects a screen-filling parent that is NOT keyboard
 * adjusted — e.g. a sibling of the KeyboardAvoidingView. Pass `inline` to place it
 * as the last child inside a KeyboardAvoidingView instead.
 */
export function KeyboardDoneBar({ inline = false }: KeyboardDoneBarProps) {
  const { visible, height } = useKeyboardState();

  const handlePress = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  if (!visible) return null;

  // Android resizes the window (android.softwareKeyboardLayoutMode: "resize"), so
  // bottom: 0 already lands above the keyboard. iOS overlays it, so offset by height.
  const bottom = Platform.OS === 'ios' ? height : 0;

  return (
    <View
      style={inline ? styles.inlineWrap : [styles.wrap, { bottom }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Close keyboard"
        accessibilityHint="Hides the keyboard so you can reach the rest of the screen."
        testID="keyboard-done-bar"
      >
        <ChevronDown size={15} color={Colors.text} strokeWidth={2.5} />
        <Text style={styles.btnText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 6,
    zIndex: 50,
  },
  inlineWrap: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.cardBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
