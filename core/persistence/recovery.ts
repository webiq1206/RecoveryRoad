import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AccountabilityData,
  IdentityProgramData,
  PrivacyControls,
  RebuildData,
  RecoveryProfile,
  UserProfile,
} from '../../types';

export const STORAGE_KEYS = {
  PROFILE: 'recovery_profile',
  PLEDGES: 'recovery_pledges',
  JOURNAL: 'recovery_journal',
  MEDIA: 'recovery_media',
  WORKBOOK_ANSWERS: 'recovery_workbook_answers',
  EMERGENCY_CONTACTS: 'recovery_emergency_contacts',
  CHECK_INS: 'recovery_check_ins',
  NEAR_MISS_EVENTS: 'recovery_near_miss_events',
  REBUILD: 'recovery_rebuild',
  ACCOUNTABILITY: 'recovery_accountability',
  TIMELINE_EVENTS: 'recovery_timeline_events',
  RELAPSE_PLAN: 'recovery_relapse_plan',
  TOOLS_USAGE: 'recovery_tools_usage',
} as const;

export const RECOVERY_KEYS_TO_CLEAR: string[] = [
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.PLEDGES,
  STORAGE_KEYS.JOURNAL,
  STORAGE_KEYS.MEDIA,
  STORAGE_KEYS.WORKBOOK_ANSWERS,
  STORAGE_KEYS.EMERGENCY_CONTACTS,
  STORAGE_KEYS.CHECK_INS,
  STORAGE_KEYS.NEAR_MISS_EVENTS,
  STORAGE_KEYS.REBUILD,
  STORAGE_KEYS.ACCOUNTABILITY,
  STORAGE_KEYS.TIMELINE_EVENTS,
  STORAGE_KEYS.RELAPSE_PLAN,
  STORAGE_KEYS.TOOLS_USAGE,
];

export const DEFAULT_PRIVACY: PrivacyControls = {
  isAnonymous: false,
  shareProgress: false,
  shareMood: false,
  allowCommunityMessages: true,
};

export const DEFAULT_RECOVERY_PROFILE: RecoveryProfile = {
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
  timeSpentDaily: 0,
  motivation: '',
  hasCompletedOnboarding: false,
  privacyControls: DEFAULT_PRIVACY,
  recoveryProfile: DEFAULT_RECOVERY_PROFILE,
};

export const DEFAULT_IDENTITY_PROGRAM: IdentityProgramData = {
  currentWeek: 1,
  startedAt: '',
  exerciseResponses: [],
  values: [],
  completedModuleIds: [],
};

export const DEFAULT_REBUILD: RebuildData = {
  habits: [],
  routines: [],
  goals: [],
  confidenceMilestones: [],
  identityProgram: DEFAULT_IDENTITY_PROGRAM,
};

export const DEFAULT_ACCOUNTABILITY: AccountabilityData = {
  contracts: [],
  partners: [],
  alerts: [],
  streakProtectionUsed: 0,
  streakProtectionMax: 3,
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

  if (typeof profile.timeSpentDaily === 'string') {
    const p = parseFloat(profile.timeSpentDaily as unknown as string);
    profile.timeSpentDaily = Number.isFinite(p) && p >= 0 ? Math.round(p * 100) / 100 : 0;
  } else if (typeof profile.timeSpentDaily !== 'number' || !Number.isFinite(profile.timeSpentDaily) || profile.timeSpentDaily < 0) {
    profile.timeSpentDaily = 0;
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

