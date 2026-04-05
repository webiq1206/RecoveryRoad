import { useMemo } from 'react';
import { useDaysSober, useHydrateRecoveryProfileStore, useRecoveryProfileStore } from '../../stores/useRecoveryProfileStore';
import type { UserDomain } from '../contracts/user';

export function useUser(): UserDomain {
  useHydrateRecoveryProfileStore();
  const profile = useRecoveryProfileStore.use.profile();
  const updateProfile = useRecoveryProfileStore.use.updateProfile();
  const isLoading = useRecoveryProfileStore.use.isLoading();
  const daysSober = useDaysSober();

  return useMemo(
    () => ({
      profile,
      daysSober,
      isOnboarded: !!profile.hasCompletedOnboarding,
      isLoading,
      updateProfile,
      // Note: setPrivacyControls/setSoberDate can be added later as narrow commands
      // once we stop exposing raw updateProfile in UI-heavy screens.
    }),
    [profile, daysSober, isLoading, updateProfile],
  );
}

