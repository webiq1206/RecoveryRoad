import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEngagement } from '../providers/EngagementProvider';
import { useNotifications } from '../providers/NotificationProvider';

/**
 * Shows a value-first explanation, then the OS permission prompt only if the user taps Continue.
 * Triggered only when navigating with `?offerNotifs=1` (see onboarding completion routes).
 */
export function useNotificationPermissionOfferFromParams() {
  const params = useLocalSearchParams<{ offerNotifs?: string }>();
  const router = useRouter();
  const { notificationPreferences, updateNotificationPrefs } = useEngagement();
  const { promptForNotificationPermission } = useNotifications();
  const consumed = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (params.offerNotifs !== '1' || consumed.current) return;
    if (notificationPreferences?.enabled) {
      consumed.current = true;
      try {
        router.setParams({ offerNotifs: undefined } as any);
      } catch {
        /* noop */
      }
      return;
    }

    consumed.current = true;

    try {
      router.setParams({ offerNotifs: undefined } as any);
    } catch {
      /* noop */
    }

    const t = setTimeout(() => {
      Alert.alert(
        'Turn on reminders?',
        'Optional: get gentle check-in window reminders and wellness nudges. If you continue, you will see the system permission prompt next. You can change this anytime in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              const ok = await promptForNotificationPermission();
              if (ok) {
                updateNotificationPrefs({ enabled: true });
              }
            },
          },
        ],
      );
    }, 600);

    return () => clearTimeout(t);
  }, [
    params.offerNotifs,
    notificationPreferences?.enabled,
    promptForNotificationPermission,
    router,
    updateNotificationPrefs,
  ]);
}
