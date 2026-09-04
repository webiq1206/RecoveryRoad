// @ts-check
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

module.exports = config;
