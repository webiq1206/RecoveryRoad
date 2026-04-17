/**
 * Live social / community backend configuration.
 *
 * When `EXPO_PUBLIC_LIVE_SOCIAL_API_URL` is set to an HTTPS URL, Recovery Rooms and related APIs
 * use the real backend (see `services/liveSocialClient.ts` and `docs/LIVE_SOCIAL.md`).
 *
 * Store / production builds without that URL must not expose incomplete “community” UX
 * (empty rooms, offline placeholders). Use `isCommunityEnabled` and `arePeerPracticeFeaturesEnabled`.
 */

declare const __DEV__: boolean;

export function getLiveSocialApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_LIVE_SOCIAL_API_URL?.trim();
  return raw && /^https?:\/\//i.test(raw) ? raw.replace(/\/+$/, '') : '';
}

export function isLiveSocialMode(): boolean {
  return getLiveSocialApiBaseUrl().length > 0;
}

/**
 * Explicit kill-switch for emergency store builds (optional). Set `EXPO_PUBLIC_COMMUNITY_ENABLED=false`
 * to hide all community / recovery-room surfaces even if an API URL is present.
 */
export function isCommunityEnabled(): boolean {
  const v = process.env.EXPO_PUBLIC_COMMUNITY_ENABLED?.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'off') return false;
  return isLiveSocialMode();
}

/**
 * On-device sample community / seeded rooms + auto-replies. Only when not in live mode and
 * running a dev bundle. Set `EXPO_PUBLIC_ALLOW_LOCAL_SOCIAL_DEMO=false` to force-disable.
 */
export function isLocalSocialDemoEnabled(): boolean {
  if (typeof __DEV__ === 'boolean' && !__DEV__) {
    return false;
  }
  if (isLiveSocialMode()) {
    return false;
  }
  return process.env.EXPO_PUBLIC_ALLOW_LOCAL_SOCIAL_DEMO !== 'false';
}

export type SocialPresentationMode = 'live' | 'local_demo' | 'offline';

export function getSocialPresentationMode(): SocialPresentationMode {
  if (isCommunityEnabled()) return 'live';
  if (isLocalSocialDemoEnabled()) return 'local_demo';
  return 'offline';
}

/**
 * Recovery Rooms, Connect “Peers/Rooms” tabs, community guidelines entry points, and premium
 * marketing for `recovery_rooms` are enabled only when:
 * - Live social is configured (`isCommunityEnabled()`), or
 * - A local engineer demo is explicitly allowed (dev bundle + `EXPO_PUBLIC_ALLOW_LOCAL_SOCIAL_DEMO` not `false`).
 *
 * Release App Store builds without `EXPO_PUBLIC_LIVE_SOCIAL_API_URL` → false (State A: fully hidden).
 */
export function arePeerPracticeFeaturesEnabled(): boolean {
  if (isCommunityEnabled()) return true;
  return isLocalSocialDemoEnabled();
}
