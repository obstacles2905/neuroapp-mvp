import * as FileSystem from 'expo-file-system/legacy';

import { poseNormalizeImageOrientation } from '@/lib/biometrics/helpers/pose-image-normalize.helper';
import type { PoseCaptureViewKind } from '@/lib/biometrics/types/pose-measurement.types';

function createSessionId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

type PersistOpts = Readonly<{
  sessionId?: string | undefined;
  slot?: PoseCaptureViewKind | undefined;
}>;

export type PoseBurstFrameMeta = Readonly<{
  height: number;
  uri: string;
  width: number;
}>;

export type PersistedPoseBurst = Readonly<{
  frameMetas: PoseBurstFrameMeta[];
  frameUris: string[];
  sessionId: string;
}>;

async function moveNormalizedToSlot(
  normalizedUri: string,
  destPath: string,
): Promise<void> {
  try {
    await FileSystem.deleteAsync(destPath, { idempotent: true });
  } catch {
    // ignore — целевого файла может не быть, это нормально
  }
  await FileSystem.moveAsync({ from: normalizedUri, to: destPath });
}

/**
 * Запекает EXIF Orientation и кладёт «прямые» JPEG-кадры в каталог сессии.
 * Возвращает не только URI кадров, но и их фактические width/height — нужны
 * для overlay (resizeMode: contain) без последующей возни с поворотами.
 */
export async function persistPoseBurstFrames(
  cacheUris: readonly string[],
  options?: PersistOpts,
): Promise<PersistedPoseBurst> {
  const base = FileSystem.documentDirectory;
  if (base == null) {
    throw new Error('Document directory is not available.');
  }

  const sessionId = options?.sessionId ?? createSessionId();
  const slot: PoseCaptureViewKind = options?.slot ?? 'frontal';

  if (slot === 'profile' && options?.sessionId == null) {
    throw new Error('Для сохранения профиля нужен sessionId сессии (сначала анфас).');
  }
  const dir = `${base}biometrics/pose-sessions/${sessionId}/${slot}/`;

  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const frameUris: string[] = [];
  const frameMetas: PoseBurstFrameMeta[] = [];

  for (let i = 0; i < cacheUris.length; i += 1) {
    const sourceUri = cacheUris[i]!;
    const dest = `${dir}frame-${i}.jpg`;
    const normalized = await poseNormalizeImageOrientation(sourceUri);
    await moveNormalizedToSlot(normalized.uri, dest);
    frameUris.push(dest);
    frameMetas.push({
      height: normalized.height,
      uri: dest,
      width: normalized.width,
    });
  }

  return { frameMetas, frameUris, sessionId };
}
