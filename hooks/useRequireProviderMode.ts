import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProviderMode } from '@/providers/ProviderModeProvider';

/**
 * Call from provider/enterprise screens. Redirects to Profile when Provider Mode is off
 * so these screens are not reachable during normal app usage.
 */
export function useRequireProviderMode(): boolean {
  const { providerModeEnabled, isLoading } = useProviderMode();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!providerModeEnabled) {
      router.replace('/(tabs)/profile' as any);
    }
  }, [providerModeEnabled, isLoading, router]);

  return providerModeEnabled && !isLoading;
}
