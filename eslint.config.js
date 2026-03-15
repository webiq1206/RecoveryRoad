const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      // Keep hooks rule enabled; we've fixed offending usages.
      "react-hooks/rules-of-hooks": "error",
    },
  },
]);
