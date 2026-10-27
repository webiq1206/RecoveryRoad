const {
  withAppBuildGradle,
  withGradleProperties,
  withDangerousMod,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Strengthen Android release R8 so Play Console DEX obfuscation clears 25%:
 * - Force minify + resource shrinking on in the release build type
 * - Use proguard-android-optimize.txt
 * - Keep R8 full mode + optimized resource shrinking
 * - Drop template-duplicated package-wide keep rules from app/proguard-rules.pro
 *   (libraries already ship equivalent consumer rules)
 */
function withAndroidR8Optimization(config) {
  config = withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    contents = contents.replace(
      /getDefaultProguardFile\(["']proguard-android\.txt["']\)/g,
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );

    // Pin release minify/shrink on. Property wiring alone has left Play at ~2% when
    // an older or non-minified AAB was scored; make the DSL unambiguous.
    contents = contents.replace(
      /minifyEnabled\s+(?:false|enableMinifyInReleaseBuilds)\b/,
      'minifyEnabled true',
    );
    contents = contents.replace(
      /shrinkResources\s+enableShrinkResources\.toBoolean\(\)/,
      'shrinkResources true',
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

    setProp('android.enableMinifyInReleaseBuilds', 'true');
    setProp('android.enableShrinkResourcesInReleaseBuilds', 'true');
    setProp('android.enableR8.fullMode', 'true');
    setProp('android.r8.optimizedResourceShrinking', 'true');

    cfg.modResults = props;
    return cfg;
  });

  // Expo's default proguard-rules.pro copies broad reanimated/turbomodule keeps.
  // Those packages already contribute consumer rules; leave app rules thin so we
  // don't stack extra package-wide -keep blocks in the merged config.
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const proguardPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro',
      );
      if (!fs.existsSync(proguardPath)) {
        return cfg;
      }

      let contents = await fs.promises.readFile(proguardPath, 'utf8');
      const stripped = contents.replace(
        /\n# react-native-reanimated\n-keep class com\.swmansion\.reanimated\.\*\* \{ \*; \}\n-keep class com\.facebook\.react\.turbomodule\.\*\* \{ \*; \}\n/g,
        '\n',
      );

      if (stripped !== contents) {
        await fs.promises.writeFile(proguardPath, stripped);
      }
      return cfg;
    },
  ]);

  return config;
}

module.exports = createRunOncePlugin(
  withAndroidR8Optimization,
  'withAndroidR8Optimization',
  '1.1.0',
);
