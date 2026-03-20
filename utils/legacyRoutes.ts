import { logger } from "@/utils/logger";

/**
 * Legacy -> canonical route mapping for gradual IA transition.
 *
 * Route resolution is always available via `resolveCanonicalRoute`.
 * Strict redirect enforcement is opt-in via `EXPO_PUBLIC_ENABLE_STRICT_IA_REDIRECTS`.
 */
export const LEGACY_ROUTE_MAP: Record<string, string> = {
  '/(tabs)/community': '/connection',
  '/(tabs)/connection': '/connection',
  '/(tabs)/support': '/support',
  '/(tabs)/rebuild': '/rebuild',
  '/(tabs)/profile': '/profile',
  '/(tabs)/progress': '/progress',
  '/(tabs)/journal': '/journal',
  '/(tabs)/triggers': '/triggers',
  '/(tabs)/milestones': '/milestones',
  '/(tabs)/accountability': '/accountability',
  '/(tabs)/pledges': '/pledges',
  '/(tabs)/connection/recovery-rooms': '/recovery-rooms',
  '/(tabs)/connection/room-session': '/room-session',
  '/(tabs)/check-ins': '/check-ins',
  '/daily-guidance': '/(tabs)/(home)/today-hub',
  '/wizard': '/(tabs)/(home)/today-hub',
  '/first-day': '/(tabs)/(home)/today-hub',
};

export function resolveCanonicalRoute(path: string): string {
  return LEGACY_ROUTE_MAP[path] ?? path;
}

export function shouldEnableStrictIARedirects(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_STRICT_IA_REDIRECTS === '1';
}

/**
 * Dev-only helper to validate strict redirect behavior.
 * Returns null when strict redirects are disabled or no mapping exists.
 */
export function getStrictRedirectTarget(legacyPath: string): string | null {
  if (!shouldEnableStrictIARedirects()) return null;
  const target = LEGACY_ROUTE_MAP[legacyPath];
  if (!target) return null;

  if (__DEV__) {
    logger.info("IA strict redirect resolved", { legacyPath, target });
  }

  return target;
}

