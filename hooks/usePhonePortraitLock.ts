import { useEffect } from 'react';
import { Platform, PixelRatio, useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const LARGE_SCREEN_MIN_DP = 600;

/**
 * Locks portrait on phones; allows rotation on large screens (tablets / foldables)
 * where Android 16+ ignores manifest orientation locks anyway.
 */
export function usePhonePortraitLock() {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const minDp = Math.min(width, height) / PixelRatio.get();
    const isLargeScreen = minDp >= LARGE_SCREEN_MIN_DP;

    if (isLargeScreen) {
      void ScreenOrientation.unlockAsync();
      return;
    }

    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return () => {
      void ScreenOrientation.unlockAsync();
    };
  }, [width, height]);
}
