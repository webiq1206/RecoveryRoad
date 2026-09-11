/**
 * User-facing copy for account deletion and lighter local cache resets.
 * Keep in sync with `getAllAccountDeletionAsyncStorageKeys` / `resetAllData`.
 */

export const DELETE_ACCOUNT_INTRO =
  'RecoveryRoad does not create or host a server-side login or profile for you. Delete account permanently erases everything the app has stored on this device for your use of the app. Apple or Google may still hold subscription or purchase records tied to your store account—manage billing there.';

/** Same scope as delete account; wording matches the “Remove all app data” entry point. */
export const REMOVE_ALL_APP_DATA_INTRO =
  'RecoveryRoad does not create or host a server-side login or profile for you. Remove all app data permanently erases everything the app has stored on this device for your use of the app. Apple or Google may still hold subscription or purchase records tied to your store account—manage billing there.';

/** Store that bills the subscription, as named to the user. */
export type SubscriptionStoreName = 'Google Play' | 'the App Store';

export function subscriptionStoreNameForPlatform(os: string): SubscriptionStoreName | null {
  if (os === 'ios') return 'the App Store';
  if (os === 'android') return 'Google Play';
  return null;
}

/**
 * Erasing local data cannot cancel a store subscription: there is no client-side API for it on
 * either platform, so billing continues until the user cancels in the store themselves.
 */
export function formatActiveSubscriptionBillingNotice(store: SubscriptionStoreName): string {
  return `Your premium subscription stays active and will keep renewing. Removing your data here does not cancel it. To stop being billed, cancel the subscription in ${store}.`;
}

export const DELETE_ACCOUNT_DATA_BULLETS: readonly string[] = [
  'Profile and onboarding (name, goals, sober date, recovery inputs, privacy toggles)',
  'Daily check-ins, near-miss events, progress stats, and relapse timeline',
  'Journal, pledges, workbook answers, emergency contacts, and media you saved in the app',
  'Rebuild and accountability data stored locally',
  'Connection hub content stored on this device (trusted contacts and similar local-only items)',
  'Cached subscription entitlement (you can restore purchases after reinstall)',
  'Engagement and notification preferences, scheduled local reminders, and reminder counters',
  'App PIN/biometric lock, security settings, and on-device audit log',
  'Optional provider or workspace demo data (only if that build option was enabled on this device)',
];

/** `activeSubscriptionStore` adds the billing-continues warning; pass null when not subscribed. */
export function formatDeleteAccountDetailsMessage(
  activeSubscriptionStore?: SubscriptionStoreName | null,
): string {
  const bullets = DELETE_ACCOUNT_DATA_BULLETS.map((line) => `• ${line}`).join('\n');
  const billing = activeSubscriptionStore
    ? `\n\n${formatActiveSubscriptionBillingNotice(activeSubscriptionStore)}`
    : '';
  return `${DELETE_ACCOUNT_INTRO}${billing}\n\nThis removes:\n${bullets}\n\nThis cannot be undone. You will set up the app again from the beginning.`;
}

/** `activeSubscriptionStore` adds the billing-continues warning; pass null when not subscribed. */
export function formatRemoveAllAppDataDetailsMessage(
  activeSubscriptionStore?: SubscriptionStoreName | null,
): string {
  const bullets = DELETE_ACCOUNT_DATA_BULLETS.map((line) => `• ${line}`).join('\n');
  const billing = activeSubscriptionStore
    ? `\n\n${formatActiveSubscriptionBillingNotice(activeSubscriptionStore)}`
    : '';
  return `${REMOVE_ALL_APP_DATA_INTRO}${billing}\n\nThis removes:\n${bullets}\n\nThis cannot be undone. You will set up the app again from the beginning.`;
}

export const CLEAR_LOCAL_DIAGNOSTICS_INTRO =
  'This clears on-device diagnostics, prediction caches, and wizard engagement memory. It does not delete your profile, check-ins, journal, pledges, contacts, or locally saved connection details.';

export const CLEAR_LOCAL_DIAGNOSTICS_BULLETS: readonly string[] = [
  'Security audit log',
  'Risk, retention, and stage-detection caches',
  'Behavioral notification counters and background session timing',
  'Wizard / quick-start engagement history used to tune prompts',
];

export function formatClearLocalDiagnosticsMessage(): string {
  const bullets = CLEAR_LOCAL_DIAGNOSTICS_BULLETS.map((line) => `• ${line}`).join('\n');
  return `${CLEAR_LOCAL_DIAGNOSTICS_INTRO}\n\nRemoved:\n${bullets}`;
}
