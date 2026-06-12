/** Фиксированные слоты видео «Слово Архитектора» на один симптом */
export const ARCHITECT_WORD_SLOT_NUMBERS = [1, 2] as const;

export type ArchitectWordSlotNumber =
  (typeof ARCHITECT_WORD_SLOT_NUMBERS)[number];

/** Сколько роликов отдаём пользователю на симптом (из доступных слотов) */
export const ARCHITECT_WORD_DELIVERY_COUNT = 2;

/** Префикс ключей в object storage */
export const ARCHITECT_WORD_MEDIA_FOLDER = 'architect-word';
