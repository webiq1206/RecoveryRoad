import type { PrivacyControls, UserProfile } from '../../types';

export interface UserDomainState {
  profile: UserProfile;
  daysSober: number;
  isOnboarded: boolean;
  isLoading: boolean;
}

export interface UserDomainCommands {
  updateProfile: (updates: Partial<UserProfile>) => void;
  setPrivacyControls?: (updates: Partial<PrivacyControls>) => void;
  setSoberDate?: (iso: string) => void;
}

export type UserDomain = UserDomainState & UserDomainCommands;

export function selectDaysSober(profile: UserProfile, now = new Date()): number {
  const soberDate = new Date(profile.soberDate);
  const diffMs = now.getTime() - soberDate.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

export function selectIsOnboarded(profile: UserProfile): boolean {
  return !!profile.hasCompletedOnboarding;
}

