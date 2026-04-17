/**
 * App Store–visible support path. Set `EXPO_PUBLIC_SUPPORT_EMAIL` (and optionally
 * `EXPO_PUBLIC_SUPPORT_URL`) in EAS env for production builds.
 */
export function getSupportEmail(): string {
  return (process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '').trim();
}

export function getSupportUrl(): string {
  return (process.env.EXPO_PUBLIC_SUPPORT_URL || '').trim();
}

export function hasConfiguredSupportContact(): boolean {
  return getSupportEmail().length > 0 || /^https?:\/\//i.test(getSupportUrl());
}
