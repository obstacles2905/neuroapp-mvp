import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Токен сессии: на iOS/Android — Keychain/Keystore (expo-secure-store);
 * на web пакет отдаёт пустой нативный stub — используем localStorage (только dev/PWA, не банк).
 */
function webGet(key: string): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(key);
}

function webSet(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

function webRemove(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
}

export async function getStoredToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webGet(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setStoredToken(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSet(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredToken(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webRemove(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
