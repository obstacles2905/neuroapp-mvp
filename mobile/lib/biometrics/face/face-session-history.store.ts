import * as FileSystem from 'expo-file-system/legacy';

import {
  FACE_SESSION_HISTORY_MAX,
  FACE_SESSION_INDEX_FILENAME,
  FACE_SESSION_MANIFEST_FILENAME,
  FACE_SESSION_PERSIST_SCHEMA_VERSION,
  FACE_SESSION_SNAPSHOTS_FILENAME,
} from '@/lib/biometrics/constants/face-session-persistence.constants';
import { recomputeFaceMetricsFromSnapshots } from '@/lib/biometrics/face/compute-face-expression-metrics';
import {
  buildFaceHeadlineSession,
  createFaceSessionId,
} from '@/lib/biometrics/face/face-session-id.helper';
import type {
  FaceExpressionMeasurementSession,
  FaceSessionQualityOverall,
} from '@/lib/biometrics/types/face-measurement.types';
import type {
  FaceSessionHistoryListItem,
  FaceSessionsIndexFile,
  PersistedFaceSessionRecord,
} from '@/lib/biometrics/types/face-session-persistence.types';

function qualityToTone(
  session: FaceExpressionMeasurementSession,
): FaceSessionHistoryListItem['tone'] {
  return session.interpretation?.tone ?? fallbackToneFromQuality(session.quality.overall);
}

function fallbackToneFromQuality(
  quality: FaceSessionQualityOverall,
): FaceSessionHistoryListItem['tone'] {
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

function faceSessionsRoot(base: string): string {
  return `${base}biometrics/face-sessions/`;
}

function indexUri(base: string): string {
  return `${faceSessionsRoot(base)}${FACE_SESSION_INDEX_FILENAME}`;
}

function sessionFolderUri(base: string, sessionId: string): string {
  return `${faceSessionsRoot(base)}${sessionId}/`;
}

function manifestUri(base: string, sessionId: string): string {
  return `${sessionFolderUri(base, sessionId)}${FACE_SESSION_MANIFEST_FILENAME}`;
}

function snapshotsUri(base: string, sessionId: string): string {
  return `${sessionFolderUri(base, sessionId)}${FACE_SESSION_SNAPSHOTS_FILENAME}`;
}

export function formatRuFaceSessionCapturedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function readIndex(base: string): Promise<FaceSessionHistoryListItem[]> {
  const uri = indexUri(base);
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return [];
  }
  try {
    const raw = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(raw) as FaceSessionsIndexFile;
    if (parsed.entries == null || !Array.isArray(parsed.entries)) {
      return [];
    }
    return parsed.entries;
  } catch {
    return [];
  }
}

async function writeIndex(
  base: string,
  entries: FaceSessionHistoryListItem[],
): Promise<void> {
  const trimmed = entries.slice(0, FACE_SESSION_HISTORY_MAX);
  const payload: FaceSessionsIndexFile = {
    entries: trimmed,
    schemaVersion: FACE_SESSION_PERSIST_SCHEMA_VERSION,
  };
  await FileSystem.makeDirectoryAsync(faceSessionsRoot(base), {
    intermediates: true,
  });
  await FileSystem.writeAsStringAsync(indexUri(base), JSON.stringify(payload));
}

function listItemFromSession(
  session: FaceExpressionMeasurementSession,
): FaceSessionHistoryListItem {
  return {
    capturedAtIso: session.capturedAt,
    expressivenessScore: session.metrics.expressivenessScore,
    headline:
      session.interpretation?.headline ??
      buildFaceHeadlineSession(
        session.metrics.expressivenessScore,
        session.capturedAt,
      ),
    quality: session.quality.overall,
    sessionId: session.id,
    tone: qualityToTone(session),
  };
}

export async function saveFaceSessionRecord(
  session: FaceExpressionMeasurementSession,
): Promise<void> {
  const base = tryDocBase();
  if (base == null) {
    return;
  }

  const folder = sessionFolderUri(base, session.id);
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

  const record: PersistedFaceSessionRecord = {
    manifest: session,
    phaseSnapshots: session.phaseSnapshots,
    schemaVersion: FACE_SESSION_PERSIST_SCHEMA_VERSION,
  };

  await FileSystem.writeAsStringAsync(
    manifestUri(base, session.id),
    JSON.stringify(record.manifest),
  );
  await FileSystem.writeAsStringAsync(
    snapshotsUri(base, session.id),
    JSON.stringify(record.phaseSnapshots),
  );

  const prev = await readIndex(base);
  const next = [listItemFromSession(session), ...prev.filter((e) => e.sessionId !== session.id)];
  await writeIndex(base, next);
}

export async function loadFaceSessionHistoriesNewestFirst(): Promise<
  FaceSessionHistoryListItem[]
> {
  const base = tryDocBase();
  if (base == null) {
    return [];
  }
  return readIndex(base);
}

export async function loadFaceSessionRecord(
  sessionId: string,
): Promise<PersistedFaceSessionRecord | null> {
  const base = tryDocBase();
  if (base == null) {
    return null;
  }

  const manifestPath = manifestUri(base, sessionId);
  const info = await FileSystem.getInfoAsync(manifestPath);
  if (!info.exists) {
    return null;
  }

  try {
    const manifestRaw = await FileSystem.readAsStringAsync(manifestPath);
    const manifest = JSON.parse(manifestRaw) as FaceExpressionMeasurementSession;
    const snapshotsRaw = await FileSystem.readAsStringAsync(snapshotsUri(base, sessionId));
    const phaseSnapshots = JSON.parse(snapshotsRaw) as PersistedFaceSessionRecord['phaseSnapshots'];

    return {
      manifest,
      phaseSnapshots,
      schemaVersion: FACE_SESSION_PERSIST_SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}

/** Пересчёт метрик по сохранённым blendshapes — без повторного инференса и без фото. */
export async function recomputePersistedFaceSession(
  sessionId: string,
  expectedPhases: number,
): Promise<FaceExpressionMeasurementSession | null> {
  const record = await loadFaceSessionRecord(sessionId);
  if (record == null) {
    return null;
  }

  const { interpretation, metrics, quality, scoringVersion } =
    recomputeFaceMetricsFromSnapshots(record.phaseSnapshots, expectedPhases);

  const updated: FaceExpressionMeasurementSession = {
    ...record.manifest,
    interpretation,
    metrics,
    phaseSnapshots: record.phaseSnapshots,
    quality,
    scoringVersion,
  };

  await saveFaceSessionRecord(updated);
  return updated;
}

export { createFaceSessionId };
