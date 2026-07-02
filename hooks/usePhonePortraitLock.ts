import { useEffect } from 'react';
import { Platform, PixelRatio, useWindowDimensions } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

const LARGE_SCREEN_MIN_DP = 600;
const hasScreenOrientationModule =
  requireOptionalNativeModule('ExpoScreenOrientation') != null;

/**
 * Locks portrait on phones; allows rotation on large screens (tablets / foldables)
 * where Android 16+ ignores manifest orientation locks anyway.
 *
 * No-op when the native module is unavailable (e.g. Expo Go without the plugin).
 */
export function usePhonePortraitLock() {
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS === 'web' || !hasScreenOrientationModule) return;

    let cancelled = false;

    void (async () => {
      const ScreenOrientation = await import('expo-screen-orientation');
      if (cancelled) return;

      const minDp = Math.min(width, height) / PixelRatio.get();
      const isLargeScreen = minDp >= LARGE_SCREEN_MIN_DP;

      if (isLargeScreen) {
        await ScreenOrientation.unlockAsync();
        return;
      }

      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    })();

    return () => {
      cancelled = true;
      void import('expo-screen-orientation').then((ScreenOrientation) =>
        ScreenOrientation.unlockAsync(),
      );
    };
  }, [width, height]);
}
