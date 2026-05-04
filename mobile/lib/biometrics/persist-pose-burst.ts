import * as FileSystem from 'expo-file-system/legacy';

function createSessionId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}-${r}`;
}

/**
 * Копирует временные снимки из кэша камеры в каталог приложения (стабильные URI).
 */
export async function persistPoseBurstFrames(
  cacheUris: string[],
): Promise<string[]> {
  const base = FileSystem.documentDirectory;
  if (base == null) {
    throw new Error('Document directory is not available.');
  }

  const sessionId = createSessionId();
  const dir = `${base}biometrics/pose-sessions/${sessionId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const persisted: string[] = [];
  for (let i = 0; i < cacheUris.length; i += 1) {
    const dest = `${dir}frame-${i}.jpg`;
    await FileSystem.copyAsync({ from: cacheUris[i]!, to: dest });
    persisted.push(dest);
  }

  return persisted;
}
