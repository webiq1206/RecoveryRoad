import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const ENCRYPTION_KEY_STORE = 'ro_encryption_key';
const SECURE_PREFIX = 'secure_';

let cachedEncryptionKey: string | null = null;

async function getOrCreateEncryptionKey(): Promise<string> {
  if (cachedEncryptionKey) return cachedEncryptionKey;

  try {
    if (Platform.OS !== 'web') {
      const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE);
      if (existing) {
        cachedEncryptionKey = existing;
        return existing;
      }
      const newKey = Crypto.randomUUID();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE, newKey);
      cachedEncryptionKey = newKey;
      return newKey;
    } else {
      const existing = localStorage.getItem(ENCRYPTION_KEY_STORE);
      if (existing) {
        cachedEncryptionKey = existing;
        return existing;
      }
      const newKey = Crypto.randomUUID();
      localStorage.setItem(ENCRYPTION_KEY_STORE, newKey);
      cachedEncryptionKey = newKey;
      return newKey;
    }
  } catch (error) {
    console.log('[SecureStorage] Error getting encryption key, using fallback:', error);
    const fallback = 'fallback_' + Date.now().toString(36);
    cachedEncryptionKey = fallback;
    return fallback;
  }
}

async function hashData(data: string): Promise<string> {
  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
  } catch (error) {
    console.log('[SecureStorage] Hash error:', error);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

function simpleEncrypt(text: string, key: string): string {
  try {
    const encoded = encodeURIComponent(text);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch (error) {
    console.log('[SecureStorage] Encrypt error:', error);
    return btoa(encodeURIComponent(text));
  }
}

function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return decodeURIComponent(result);
  } catch (error) {
    console.log('[SecureStorage] Decrypt error, trying plain:', error);
    try {
      return decodeURIComponent(atob(encrypted));
    } catch {
      return encrypted;
    }
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    const encKey = await getOrCreateEncryptionKey();
    const encrypted = simpleEncrypt(value, encKey);
    await AsyncStorage.setItem(SECURE_PREFIX + key, encrypted);
    console.log('[SecureStorage] Stored encrypted data for key:', key);
  } catch (error) {
    console.log('[SecureStorage] secureSet error:', error);
    await AsyncStorage.setItem(key, value);
  }
}

export async function secureGet(key: string): Promise<string | null> {
  try {
    const encrypted = await AsyncStorage.getItem(SECURE_PREFIX + key);
    if (!encrypted) {
      const plainFallback = await AsyncStorage.getItem(key);
      if (plainFallback) {
        console.log('[SecureStorage] Migrating plain data to encrypted for key:', key);
        await secureSet(key, plainFallback);
        await AsyncStorage.removeItem(key);
        return plainFallback;
      }
      return null;
    }
    const encKey = await getOrCreateEncryptionKey();
    return simpleDecrypt(encrypted, encKey);
  } catch (error) {
    console.log('[SecureStorage] secureGet error:', error);
    return await AsyncStorage.getItem(key);
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(SECURE_PREFIX + key);
    await AsyncStorage.removeItem(key);
    console.log('[SecureStorage] Deleted data for key:', key);
  } catch (error) {
    console.log('[SecureStorage] secureDelete error:', error);
  }
}

export async function secureSetJSON<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  await secureSet(key, json);
}

export async function secureGetJSON<T>(key: string): Promise<T | null> {
  const json = await secureGet(key);
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.log('[SecureStorage] JSON parse error for key:', key, error);
    return null;
  }
}

export async function storePIN(pin: string): Promise<void> {
  const hashed = await hashData(pin + '_recovery_one_salt');
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync('ro_pin_hash', hashed);
  } else {
    localStorage.setItem('ro_pin_hash', hashed);
  }
  console.log('[SecureStorage] PIN stored securely');
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const hashed = await hashData(pin + '_recovery_one_salt');
  let stored: string | null = null;
  if (Platform.OS !== 'web') {
    stored = await SecureStore.getItemAsync('ro_pin_hash');
  } else {
    stored = localStorage.getItem('ro_pin_hash');
  }
  return stored === hashed;
}

export async function hasPIN(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    const pin = await SecureStore.getItemAsync('ro_pin_hash');
    return pin !== null;
  } else {
    return localStorage.getItem('ro_pin_hash') !== null;
  }
}

export async function removePIN(): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync('ro_pin_hash');
  } else {
    localStorage.removeItem('ro_pin_hash');
  }
  console.log('[SecureStorage] PIN removed');
}

export async function generateSessionId(): Promise<string> {
  return Crypto.randomUUID();
}

export async function anonymizeId(id: string): Promise<string> {
  return await hashData(id + '_anonymize');
}

export { hashData };
