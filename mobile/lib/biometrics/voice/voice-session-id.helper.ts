import type { VoiceMeasurementSession } from '@/lib/biometrics/types/voice-measurement.types';

export function createVoiceSessionId(): string {
  const fn = globalThis.crypto?.randomUUID;
  if (typeof fn === 'function') {
    return fn.call(globalThis.crypto);
  }
  const rnd = (): string =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(-4);
  return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(0, 3)}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export function buildVoiceHeadlineSession(model: VoiceMeasurementSession): string {
  const q = model.quality.overall;
  if (q === 'failed') {
    return 'Голос · качество записи: не удалось';
  }
  if (q === 'retry_suggested') {
    return 'Голос · есть замечания по качеству';
  }
  const tension = model.metrics.throatTensionScore;
  if (tension >= 60) {
    return `Голос · напряжённость ${String(tension)}`;
  }
  return 'Голос · замер сохранён';
}
