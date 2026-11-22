const { createRunOncePlugin, withAppBuildGradle, withMainActivity } = require('@expo/config-plugins');

function withAndroidEdgeToEdge(config) {
  config = withMainActivity(config, (config) => {
    const { modResults } = config;
    const importLine = 'import androidx.core.view.WindowCompat';
    const edgeToEdgeCall = 'WindowCompat.enableEdgeToEdge(window)';
    if (!modResults.contents.includes(edgeToEdgeCall)) {
      const activityStart = /^([ \t]*)super\.onCreate\(null\)$/m;
      if (modResults.language !== 'kt' || !activityStart.test(modResults.contents)) {
        throw new Error('Unable to enable edge-to-edge in the generated Android MainActivity.');
      }
      modResults.contents = modResults.contents
        .replace('import android.os.Bundle', `import android.os.Bundle\n${importLine}`)
        .replace(activityStart, `$1${edgeToEdgeCall}\n$1super.onCreate(null)`);
    }
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    // Material 1.14 limits BottomSheetDialog's legacy status bar setter to API < 35.
    const material = 'implementation("com.google.android.material:material:1.14.0")';
    if (!config.modResults.contents.includes(material)) {
      config.modResults.contents += `\ndependencies {\n    ${material}\n}\n`;
    }
    return config;
  });
}

module.exports = createRunOncePlugin(withAndroidEdgeToEdge, 'withAndroidEdgeToEdge', '1.0.0');
