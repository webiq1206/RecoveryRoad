// @ts-check
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const {
  enhanceWithDevClientCameraBridge,
} = require("./scripts/dev-client-camera-bridge.cjs");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reload this file when the chooser helper changes (Expo caches metro.config).
// Expo Go needs `npx expo start --go` (or press s) — a development-build manifest fails in Expo Go.
const previousEnhance = config.server?.enhanceMiddleware;
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware, server) => {
  const next = previousEnhance ? previousEnhance(middleware, server) : middleware;
  return enhanceWithDevClientCameraBridge(next);
};

/**
 * react-native-purchases-ui points its "react-native" entry at TypeScript source.
 * After SDK upgrades Metro can desync those module IDs ("Requiring unknown module").
 * Resolve to the published JS build instead.
 */
const purchasesUiEntry = path.resolve(
  __dirname,
  "node_modules/react-native-purchases-ui/lib/module/index.js",
);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-purchases-ui") {
    return { type: "sourceFile", filePath: purchasesUiEntry };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
