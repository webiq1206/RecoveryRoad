const { getDefaultConfig } = require("expo/metro-config");

let config = getDefaultConfig(__dirname);

if (process.env.RORK === "true") {
  const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
  config = withRorkMetro(config);
}

module.exports = config;