import type { VoiceProtocolStepKind } from '@/lib/biometrics/types/voice-measurement.types';

/**
 * Урезанный «слой инференса»: признаки, которые в продакшене должны приходить из openSMILE.
 * Stub заполняет их из metering до подключения нативного экстрактора.
 */
export interface OpensmileLowLevelFeatureSnapshot {
  /** Функционалы eGeMAPS (если доступен нативный openSMILE на Android). */
  gemapsFunctionals?: Record<string, number> | undefined;
  /** Относительная энергетическая вариативность по metering (0–∞), условная. */
  energyCoefficientOfVariation: number;
  /** Доля «тишины» по metering, 0–1. */
  silenceRatio: number;
  /** Продолжительность шага, мс. */
  durationMs: number;
  kind: VoiceProtocolStepKind;
  /** Прокси максимальной серии «перегруза» по metering. */
  clippingRunMax: number;
}

export interface VoiceOpensmileExtractor {
  extract(featuresByStep: readonly OpensmileLowLevelFeatureSnapshot[]): OpensmileLowLevelFeatureSnapshot[];
}

/** Stub: возвращает те же признаки (место для будущего DSP/openSMILE). */
export function createStubOpensmileExtractor(): VoiceOpensmileExtractor {
  return {
    extract(featuresByStep: readonly OpensmileLowLevelFeatureSnapshot[]): OpensmileLowLevelFeatureSnapshot[] {
      return [...featuresByStep];
    },
  };
}
