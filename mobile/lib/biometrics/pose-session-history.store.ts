import * as FileSystem from 'expo-file-system/legacy';

import {
  POSE_SESSION_HISTORY_MAX,
  POSE_SESSION_INDEX_FILENAME,
  POSE_SESSION_MANIFEST_FILENAME,
  POSE_SESSION_PERSIST_SCHEMA_VERSION,
} from '@/lib/biometrics/constants/pose-session-persistence.constants';
import {
  type PersistedPoseSessionRecord,
  type PoseSessionHistoryListItem,
  type PoseSessionsIndexFile,
} from '@/lib/biometrics/types/pose-session-persistence.types';
import type {
  PoseDualViewSessionResult,
  PoseInterpretationTone,
  PoseSessionQuality,
} from '@/lib/biometrics/types/pose-measurement.types';

function combineQualities(a: PoseSessionQuality, b: PoseSessionQuality): PoseSessionQuality {
  if (a === 'failed' || b === 'failed') {
    return 'failed';
  }
  if (a === 'retry_suggested' || b === 'retry_suggested') {
    return 'retry_suggested';
  }
  return 'ok';
}

function qualityToTone(quality: PoseSessionQuality): PoseInterpretationTone {
  if (quality === 'failed') {
    return 'attention';
  }
  if (quality === 'retry_suggested') {
    return 'neutral';
  }
  return 'positive';
}

function shortenQuality(quality: PoseSessionQuality): string {
  if (quality === 'failed') {
    return 'нет';
  }
  if (quality === 'retry_suggested') {
    return 'повторить';
  }
  return 'ок';
}

function headlineFromDual(result: PoseDualViewSessionResult): string {
  const fa = shortenQuality(result.frontal.quality);
  const fb = shortenQuality(result.profile.quality);
  return `Двухракурсный · анфас ${fa} · профиль ${fb}`;
}

function tryDocBase(): string | null {
  const base = FileSystem.documentDirectory;
  return base != null ? base : null;
}

function poseSessionsRoot(base: string): string {
  return `${base}biometrics/pose-sessions/`;
}

function indexUri(base: string): string {
  return `${poseSessionsRoot(base)}${POSE_SESSION_INDEX_FILENAME}`;
}

function sessionFolderUri(base: string, sessionId: string): string {
  return `${poseSessionsRoot(base)}${sessionId}/`;
}

function manifestUri(base: string, sessionId: string): string {
  return `${sessionFolderUri(base, sessionId)}${POSE_SESSION_MANIFEST_FILENAME}`;
}

export function formatRuPoseSessionCapturedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function readIndex(base: string): Promise<PoseSessionHistoryListItem[]> {
  const uri = indexUri(base);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return [];
  }
  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(raw) as PoseSessionsIndexFile;
    if (parsed.entries == null || !Array.isArray(parsed.entries)) {
      return [];
    }
    return parsed.entries;
  } catch {
    return [];
  }
}

async function writeIndex(base: string, entries: PoseSessionHistoryListItem[]): Promise<void> {
  const payload: PoseSessionsIndexFile = {
    entries,
    schemaVersion: POSE_SESSION_PERSIST_SCHEMA_VERSION,
  };
  await FileSystem.writeAsStringAsync(indexUri(base), JSON.stringify(payload));
}

async function wipeSessionFolder(base: string, sessionId: string): Promise<void> {
  const dir = sessionFolderUri(base, sessionId);
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    return;
  }
  await FileSystem.deleteAsync(dir, { idempotent: true });
}

/**
 * Сохранить JSON сессию и обновить индекс истории на устройстве.
 */
export async function savePoseSessionRecord(
  sessionId: string,
  result: PoseDualViewSessionResult,
): Promise<void> {
  const base = tryDocBase();
  if (base == null) {
    return;
  }

  const persistedAtIso = new Date().toISOString();
  const record: PersistedPoseSessionRecord = {
    persistedAtIso,
    result,
    schemaVersion: '2',
    sessionId,
  };

  await FileSystem.writeAsStringAsync(
    manifestUri(base, sessionId),
    JSON.stringify(record),
  );

  const cq = combineQualities(result.frontal.quality, result.profile.quality);
  const row: PoseSessionHistoryListItem = {
    capturedAtIso: result.frontal.observation.capturedAt,
    headline: headlineFromDual(result),
    quality: cq,
    sessionId,
    tone: qualityToTone(cq),
  };

  let entries = await readIndex(base);
  entries = entries.filter((item) => item.sessionId !== row.sessionId);
  const merged = [row, ...entries].sort((a, b) =>
    b.capturedAtIso.localeCompare(a.capturedAtIso),
  );
  const truncated = merged.slice(0, POSE_SESSION_HISTORY_MAX);
  const dropped = merged.slice(POSE_SESSION_HISTORY_MAX);
  await writeIndex(base, truncated);
  await Promise.all(dropped.map((d) => wipeSessionFolder(base, d.sessionId)));
}

/** Список замеров: новее — выше (по `capturedAtIso`). */
export async function loadPoseSessionHistoriesNewestFirst(): Promise<PoseSessionHistoryListItem[]> {
  const base = tryDocBase();
  if (base == null) {
    return [];
  }
  const entries = await readIndex(base);
  return [...entries].sort((a, b) => b.capturedAtIso.localeCompare(a.capturedAtIso));
}

export async function loadPersistedPoseSession(
  sessionId: string,
): Promise<PersistedPoseSessionRecord | null> {
  const base = tryDocBase();
  if (base == null) {
    return null;
  }
  const uri = manifestUri(base, sessionId);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return null;
  }
  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    return JSON.parse(raw) as PersistedPoseSessionRecord;
  } catch {
    return null;
  }
}
