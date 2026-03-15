/**
 * Shared storage keys, defaults, and persistence helpers for recovery state.
 * Used by RecoveryProvider and by store hooks (useRecoveryProfileStore, useCheckInsStore).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  UserProfile,
  RecoveryProfile,
  PrivacyControls,
} from '@/types';

export const STORAGE_KEYS = {
  PROFILE: 'recovery_profile',
  CHECK_INS: 'recovery_check_ins',
  NEAR_MISS_EVENTS: 'recovery_near_miss_events',
  TIMELINE_EVENTS: 'recovery_timeline_events',
  RELAPSE_PLAN: 'recovery_relapse_plan',
} as const;

const DEFAULT_PRIVACY: PrivacyControls = {
  isAnonymous: false,
  shareProgress: false,
  shareMood: false,
  allowCommunityMessages: true,
};

const DEFAULT_RECOVERY_PROFILE: RecoveryProfile = {
  recoveryStage: 'crisis',
  struggleLevel: 3,
  relapseCount: 0,
  triggers: [],
  sleepQuality: 'fair',
  supportAvailability: 'limited',
  goals: [],
  riskScore: 50,
  interventionIntensity: 'moderate',
  baselineStabilityScore: 50,
  baselineStability: 50,
  relapseRiskLevel: 'moderate',
  emotionalBaseline: 3,
  cravingBaseline: 3,
  supportLevel: 'medium',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: '',
  addictions: [],
  soberDate: new Date().toISOString(),
  dailySavings: 0,
  motivation: '',
  hasCompletedOnboarding: false,
  privacyControls: DEFAULT_PRIVACY,
  recoveryProfile: DEFAULT_RECOVERY_PROFILE,
};

export function migrateProfile(stored: Record<string, unknown>): UserProfile {
  const profile = { ...DEFAULT_PROFILE, ...stored } as UserProfile;
  if (
    'addiction' in stored &&
    typeof stored.addiction === 'string' &&
    (stored.addiction as string).length > 0
  ) {
    if (!Array.isArray(profile.addictions) || profile.addictions.length === 0) {
      profile.addictions = [stored.addiction as string];
    }
  }
  if (!Array.isArray(profile.addictions)) {
    profile.addictions = [];
  }
  if (!profile.privacyControls) {
    profile.privacyControls = DEFAULT_PRIVACY;
  }
  if (!profile.recoveryProfile) {
    profile.recoveryProfile = DEFAULT_RECOVERY_PROFILE;
  }
  return profile;
}

export async function loadStorageItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (e) {
    console.log(`Error loading ${key}:`, e);
    return fallback;
  }
}

export async function saveStorageItem<T>(key: string, data: T): Promise<T> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
  return data;
}
