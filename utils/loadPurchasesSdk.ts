import { Platform } from 'react-native';
import { isExpoGo } from './runtime';
import type * as PurchasesNS from 'react-native-purchases';

type PurchasesMod = typeof import('react-native-purchases');

let cached: PurchasesMod | null | undefined;

/**
 * RevenueCat is not in Expo Go. Never require the native module there or the
 * app fails before JS can render.
 */
export function loadPurchasesModule(): PurchasesMod | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || isExpoGo()) {
    cached = null;
    return null;
  }
  try {
    cached = require('react-native-purchases') as PurchasesMod;
  } catch {
    cached = null;
  }
  return cached;
}

export function loadPurchases(): PurchasesNS.default | null {
  return loadPurchasesModule()?.default ?? null;
}

export function requirePurchases(): PurchasesNS.default {
  const sdk = loadPurchases();
  if (!sdk) {
    throw new Error('Purchases native SDK is not available in this runtime');
  }
  return sdk;
}
