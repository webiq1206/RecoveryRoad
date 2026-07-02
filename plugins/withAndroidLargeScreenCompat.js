const { withAndroidManifest } = require('@expo/config-plugins');

/** Orientations Android 16+ ignores on large screens (sw >= 600dp). */
const RESTRICTED_ORIENTATIONS = new Set([
  'portrait',
  'landscape',
  'reversePortrait',
  'reverseLandscape',
  'sensorPortrait',
  'sensorLandscape',
  'userPortrait',
  'userLandscape',
]);

/**
 * Removes portrait/landscape locks from merged AndroidManifest activities so Play
 * Console does not flag restricted resizability (Android 16 large-screen policy).
 * Phone portrait UX is handled at runtime via expo-screen-orientation.
 */
function withAndroidLargeScreenCompat(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;

    if (application.$) {
      application.$['android:resizeableActivity'] = 'true';
    }

    const stripActivity = (activity) => {
      if (!activity?.$) return;
      const orientation = activity.$['android:screenOrientation'];
      if (orientation && RESTRICTED_ORIENTATIONS.has(orientation)) {
        delete activity.$['android:screenOrientation'];
      }
      activity.$['android:resizeableActivity'] = 'true';
    };

    for (const activity of application.activity ?? []) {
      stripActivity(activity);
    }
    for (const alias of application['activity-alias'] ?? []) {
      stripActivity(alias);
    }

    return cfg;
  });
}

module.exports = withAndroidLargeScreenCompat;
