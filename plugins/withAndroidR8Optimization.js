const {
  withAppBuildGradle,
  withGradleProperties,
  createRunOncePlugin,
} = require('@expo/config-plugins');

/**
 * Strengthen Android release R8 so Play Console obfuscation % rises:
 * - Use proguard-android-optimize.txt (not the non-optimizing default)
 * - Keep R8 full mode on
 * - Enable optimized resource shrinking when AGP supports it
 */
function withAndroidR8Optimization(config) {
  config = withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (contents.includes('proguard-android.txt')) {
      contents = contents.replace(
        /getDefaultProguardFile\(["']proguard-android\.txt["']\)/g,
        'getDefaultProguardFile("proguard-android-optimize.txt")',
      );
    }

    // Ensure minify is wired to the expo-build-properties flag if a hardcoded false slipped in.
    contents = contents.replace(
      /minifyEnabled\s+false/,
      'minifyEnabled enableMinifyInReleaseBuilds',
    );

    cfg.modResults.contents = contents;
    return cfg;
  });

  config = withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;

    const setProp = (key, value) => {
      const existing = props.find((item) => item.type === 'property' && item.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    };

    // Full mode is default on modern AGP; force-enable in case a prior template disabled it.
    setProp('android.enableR8.fullMode', 'true');
    // Better resource shrinking when unused code is removed (AGP 8.12+).
    setProp('android.r8.optimizedResourceShrinking', 'true');

    cfg.modResults = props;
    return cfg;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withAndroidR8Optimization,
  'withAndroidR8Optimization',
  '1.0.0',
);
