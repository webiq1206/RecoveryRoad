import React from 'react';
import { StatusBar } from 'expo-status-bar';

type SystemBarsProps = {
  style: 'auto' | 'inverted' | 'light' | 'dark';
};

/**
 * System status bar appearance. Uses expo-status-bar (style / visibility only).
 * Avoids react-native-edge-to-edge, which calls Android 15–deprecated
 * setStatusBarColor / setNavigationBarColor / cutout-mode APIs.
 */
export function AppSystemBars({ style }: SystemBarsProps) {
  const statusStyle = style === 'inverted' ? 'auto' : style;
  return <StatusBar style={statusStyle} />;
}
