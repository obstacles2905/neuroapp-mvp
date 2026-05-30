import { NativeModules, Platform } from 'react-native';

type NativeVoiceOpensmile = {
  extractEgmapsFunctionalCsv: (wavPath: string) => Promise<{ columns: string[]; values: number[] }>;
  transcodeTo16kMonoWav: (sourceUri: string) => Promise<string>;
};

function getNativeModule(): NativeVoiceOpensmile | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  const mod = NativeModules.NeuroVoiceOpensmile as NativeVoiceOpensmile | undefined;
  return mod ?? null;
}

export function isAndroidOpensmileNativeAvailable(): boolean {
  return getNativeModule() != null;
}

export async function transcodeRecordingToWav(sourceUri: string): Promise<string> {
  const mod = getNativeModule();
  if (mod == null) {
    throw new Error('opensmile_native_unavailable');
  }
  return mod.transcodeTo16kMonoWav(sourceUri);
}

export async function extractEgmapsFunctional(wavPath: string): Promise<Record<string, number>> {
  const mod = getNativeModule();
  if (mod == null) {
    throw new Error('opensmile_native_unavailable');
  }
  const r = await mod.extractEgmapsFunctionalCsv(wavPath);
  const map: Record<string, number> = {};
  const len = Math.min(r.columns.length, r.values.length);
  for (let i = 0; i < len; i += 1) {
    const key = r.columns[i];
    if (key != null) {
      map[key] = r.values[i] ?? 0;
    }
  }
  return map;
}
