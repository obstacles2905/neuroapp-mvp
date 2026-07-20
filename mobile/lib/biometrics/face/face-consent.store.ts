import * as SecureStore from 'expo-secure-store';

import { FACE_CONSENT_STORAGE_KEY } from '@/lib/biometrics/constants/face-capture.constants';

export async function hasFaceBiometryConsent(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(FACE_CONSENT_STORAGE_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setFaceBiometryConsent(): Promise<void> {
  await SecureStore.setItemAsync(FACE_CONSENT_STORAGE_KEY, '1');
}
