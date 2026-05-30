/** Версия JSON-манифеста сессии (миграции при смене формата). */
export const POSE_SESSION_PERSIST_SCHEMA_VERSION = '2';

/** Максимум записей в индексе; старые сессии удаляются с диска вместе с кадрами. */
export const POSE_SESSION_HISTORY_MAX = 50;

export const POSE_SESSION_MANIFEST_FILENAME = 'session.json';

export const POSE_SESSION_INDEX_FILENAME = 'sessions-index.json';
