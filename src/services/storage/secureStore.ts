/**
 * Обёртка над хранилищем токенов.
 * На нативе — expo-secure-store (Keychain на iOS / Keystore на Android).
 * В браузере (Expo Web) — localStorage, чтобы прототип работал и на десктопе.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@/types';

const ACCESS_KEY = 'modus.accessToken';
const REFRESH_KEY = 'modus.refreshToken';
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await setItem(ACCESS_KEY, tokens.accessToken);
  await setItem(REFRESH_KEY, tokens.refreshToken);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const accessToken = await getItem(ACCESS_KEY);
  const refreshToken = await getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await removeItem(ACCESS_KEY);
  await removeItem(REFRESH_KEY);
}
