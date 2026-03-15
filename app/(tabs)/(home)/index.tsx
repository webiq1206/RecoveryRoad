import React from 'react';
import { Redirect } from 'expo-router';
import { useRecovery } from '@/providers/RecoveryProvider';
import { HomeLoadingSkeleton } from '@/components/LoadingSkeleton';

export default function HomeScreenRedirect() {
  const { profile, isLoading } = useRecovery();

  if (isLoading) {
    return <HomeLoadingSkeleton />;
  }

  if (!profile.hasCompletedOnboarding) {
    return <Redirect href={'/onboarding' as any} />;
  }

  return <Redirect href={'/(tabs)/(home)/today-hub' as any} />;
}
