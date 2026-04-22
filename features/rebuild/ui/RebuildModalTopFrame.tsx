import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Full-screen dimmed overlay with the form anchored to the top (safe area). No
 * KeyboardAvoidingView — layout + max scroll height keep the keyboard in the lower
 * screen and avoid Android layout freezes.
 */
export function RebuildModalTopFrame({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 10,
          paddingHorizontal: 14,
          paddingBottom: 10,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
});
