import React from 'react';
import { TurboModuleRegistry } from 'react-native';

type SystemBarsProps = {
  style: 'auto' | 'inverted' | 'light' | 'dark';
};

let SystemBarsComponent: React.ComponentType<SystemBarsProps> | null = null;

if (TurboModuleRegistry.get('RNEdgeToEdge') != null) {
  SystemBarsComponent = require('react-native-edge-to-edge').SystemBars;
}

/** Edge-to-edge status/navigation bars; no-op when native module is unavailable (e.g. Expo Go). */
export function AppSystemBars(props: SystemBarsProps) {
  if (!SystemBarsComponent) return null;
  return <SystemBarsComponent {...props} />;
}
