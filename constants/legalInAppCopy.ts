/** In-app legal summaries (not a substitute for counsel-reviewed policies). */

export const IN_APP_LEGAL_LAST_UPDATED = 'April 16, 2026';

export type LegalSection = { heading: string; body: string };

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: 'No Recovery Companion cloud account',
    body:
      'Recovery Companion is built around on-device storage. We do not register you for a separate Recovery Companion cloud login, hosted user profile, or central account database.\n\n' +
      'Deleting your data in Settings permanently erases what the app has stored locally on this device (see the delete flow for the exact categories). Store billing records may still exist under your Apple ID or Google account.',
  },
  {
    heading: 'Where your data lives',
    body:
      'Recovery content and preferences you enter are stored on this device unless you enable optional features (such as live community) that send specific content to a backend described in that feature’s UI and documentation.\n\n' +
      'Device backups (iCloud, Google backup, etc.) may copy app data according to your platform settings.',
  },
  {
    heading: 'Encryption',
    body:
      'Sensitive values can be stored using platform secure storage and additional app-layer protection where implemented. This reduces casual access on a lost device but cannot guarantee security if the OS or device is compromised.',
  },
  {
    heading: 'Contact',
    body:
      'For privacy questions or data requests, use the support contact shown on your App Store or Google Play listing.',
  },
];

export const TERMS_OF_SERVICE_SECTIONS: LegalSection[] = [
  {
    heading: 'Acceptance',
    body:
      'By using Recovery Companion you agree to these terms and to the Community Guidelines if you use social or peer features. If you do not agree, do not use the app.',
  },
  {
    heading: 'Not medical or crisis care',
    body:
      'The app is a self-help and planning tool, not a medical service, therapist, or 24/7 crisis line. For emergencies, contact local emergency services or a crisis hotline in your country.',
  },
  {
    heading: 'Your responsibilities',
    body:
      'You are responsible for the accuracy of information you enter and for how you use peer or community features. Do not harass others, share illegal content, or misuse reporting tools.',
  },
  {
    heading: 'Subscriptions and purchases',
    body:
      'Paid features are billed through the app store. Manage, cancel, or restore purchases in your Apple or Google account settings following store rules.',
  },
  {
    heading: 'Changes',
    body:
      'We may update the app, these summaries, or store-facing policies. Continued use after meaningful changes means you accept the updated terms as posted in the app or stores.',
  },
];

export const DATA_AND_SHARING_SECTIONS: LegalSection[] = [
  {
    heading: 'What stays on this device',
    body:
      'Check-ins, journal entries, protection profile details, triggers, contacts you add, and most recovery analytics are intended to stay on this phone or tablet unless a feature explicitly sends data elsewhere.\n\n' +
      'Turning off optional sharing keeps that category of information from being presented to peers in community areas (subject to how each screen is implemented).',
  },
  {
    heading: 'What can be shared (your consent)',
    body:
      'Switches under Privacy & Identity (in Settings and during onboarding) control whether you allow things like progress or mood signals to be visible to peers, and whether community messages are allowed.\n\n' +
      'Anonymous mode uses a display label instead of your name where that mode applies. It does not by itself remove data already stored on your device.',
  },
  {
    heading: 'Community and live features',
    body:
      'Recovery rooms and related features have their own rules. Read the Community Guidelines before posting or messaging. When live community is enabled for your build, messages or reports may be processed by the app’s backend for delivery or moderation as described in-app and in product documentation.',
  },
  {
    heading: 'Deletion and “account”',
    body:
      'There is no separate Recovery Companion cloud account to delete. Clearing app data or using the delete flow in Settings removes locally stored app data on this device. Purchases and store receipts may still exist in Apple or Google systems.',
  },
  {
    heading: 'Exports and backups',
    body:
      'We do not provide a separate “export my recovery file” flow in every build. Your platform backup (iCloud, Google, device backup) may include app data until you remove the app or change backup settings.',
  },
];
