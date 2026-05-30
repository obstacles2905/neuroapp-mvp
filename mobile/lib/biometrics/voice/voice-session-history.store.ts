import * as FileSystem from 'expo-file-system/legacy';

import {
  VOICE_SESSION_HISTORY_MAX,
  VOICE_SESSION_INDEX_FILENAME,
  VOICE_SESSION_MANIFEST_FILENAME,
  VOICE_SESSION_PERSIST_SCHEMA_VERSION,
} from '@/lib/biometrics/constants/voice-session-persistence.constants';
import type {
  PersistedVoiceSessionRecord,
  VoiceSessionHistoryListItem,
  VoiceSessionsIndexFile,
} from '@/lib/biometrics/types/voice-session-persistence.types';
import type {
  VoiceInterpretationTone,
  VoiceMeasurementSession,
  VoiceSessionQualityOverall,
} from '@/lib/biometrics/types/voice-measurement.types';
import { buildVoiceHeadlineSession } from '@/lib/biometrics/voice/voice-session-id.helper';

function qualityToTone(quality: VoiceSessionQualityOverall): VoiceInterpretationTone {
  if (quality === 'failed') {
    return 'attention';
  }
  if (quality === 'retry_suggested') {
    return 'neutral';
  }
  return 'positive';
}

function tryDocBase(): string | null {
  const base = FileSystem.documentDirectory;
  return base != null ? base : null;
}

function voiceSessionsRoot(base: string): string {
  return `${base}biometrics/voice-sessions/`;
}

function indexUri(base: string): string {
  return `${voiceSessionsRoot(base)}${VOICE_SESSION_INDEX_FILENAME}`;
}

function sessionFolderUri(base: string, sessionId: string): string {
  return `${voiceSessionsRoot(base)}${sessionId}/`;
}

function manifestUri(base: string, sessionId: string): string {
  return `${sessionFolderUri(base, sessionId)}${VOICE_SESSION_MANIFEST_FILENAME}`;
}

export function formatRuVoiceSessionCapturedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function readIndex(base: string): Promise<VoiceSessionHistoryListItem[]> {
  const uri = indexUri(base);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return [];
  }
  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(raw) as VoiceSessionsIndexFile;
    if (parsed.entries == null || !Array.isArray(parsed.entries)) {
      return [];
    }
    return parsed.entries;
  } catch {
    return [];
  }
}

async function writeIndex(base: string, entries: VoiceSessionHistoryListItem[]): Promise<void> {
  const payload: VoiceSessionsIndexFile = {
    entries,
    schemaVersion: VOICE_SESSION_PERSIST_SCHEMA_VERSION,
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

export async function saveVoiceSessionRecord(
  sessionId: string,
  result: VoiceMeasurementSession,
): Promise<void> {
  const base = tryDocBase();
  if (base == null) {
    return;
  }

  const persistedAtIso = new Date().toISOString();
  const record: PersistedVoiceSessionRecord = {
    persistedAtIso,
    result,
    schemaVersion: VOICE_SESSION_PERSIST_SCHEMA_VERSION,
    sessionId,
  };

  await FileSystem.makeDirectoryAsync(sessionFolderUri(base, sessionId), {
    intermediates: true,
  });
  await FileSystem.writeAsStringAsync(
    manifestUri(base, sessionId),
    JSON.stringify(record),
  );

  const row: VoiceSessionHistoryListItem = {
    capturedAtIso: result.capturedAt,
    headline: buildVoiceHeadlineSession(result),
    quality: result.quality.overall,
    sessionId,
    tone: qualityToTone(result.quality.overall),
  };

  let entries = await readIndex(base);
  entries = entries.filter((item) => item.sessionId !== row.sessionId);
  const merged = [row, ...entries].sort((a, b) =>
    b.capturedAtIso.localeCompare(a.capturedAtIso),
  );
  const truncated = merged.slice(0, VOICE_SESSION_HISTORY_MAX);
  const dropped = merged.slice(VOICE_SESSION_HISTORY_MAX);
  await writeIndex(base, truncated);
  await Promise.all(dropped.map((d) => wipeSessionFolder(base, d.sessionId)));
}

export async function loadVoiceSessionHistoriesNewestFirst(): Promise<VoiceSessionHistoryListItem[]> {
  const base = tryDocBase();
  if (base == null) {
    return [];
  }
  const entries = await readIndex(base);
  return [...entries].sort((a, b) => b.capturedAtIso.localeCompare(a.capturedAtIso));
}

export async function loadPersistedVoiceSession(
  sessionId: string,
): Promise<PersistedVoiceSessionRecord | null> {
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
    return JSON.parse(raw) as PersistedVoiceSessionRecord;
  } catch {
    return null;
  }
}
