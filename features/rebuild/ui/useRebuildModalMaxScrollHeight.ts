import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Caps the form panel height so it sits in the upper part of the screen; the system
 * keyboard uses the lower area instead of covering the card.
 */
export function useRebuildModalMaxScrollHeight() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const reservedForKeyboard = 300;
    const topChrome = insets.top + 48;
    return Math.max(220, Math.min(height * 0.58, height - topChrome - reservedForKeyboard));
  }, [height, insets.top]);
}
