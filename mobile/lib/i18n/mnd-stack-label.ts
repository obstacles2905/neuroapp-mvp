const MND_STACK_SHORT_LABEL_RU: Record<string, string> = {
  'ST-1': 'вагус и шея',
  'ST-2': 'челюсть и лицо',
  'ST-3': 'опора и вес тела',
  'ST-4': 'мягкий взгляд',
  'ST-5': 'дыхание',
  'ST-6': 'голос и резонанс',
};

/** Человекочитаемая подпись стека для карточки сессии (код с бэка — ST-1 … ST-6). */
export function mndStackShortLabelRu(code: string): string {
  return MND_STACK_SHORT_LABEL_RU[code] ?? code;
}
