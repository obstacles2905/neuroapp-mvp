/**
 * Сопоставление имён колонок CSV eGeMAPSv02 (openSMILE) с акустическими сигналами.
 * Имена зависят от GeMAPS v01b + eGeMAPS v02 (см. config/gemaps, config/egemaps).
 */

export interface EgmapsAcousticSignals {
  equivalentSoundLevelDb: number | undefined;
  f0SemitoneMean: number | undefined;
  f0SemitoneRange: number;
  hnrDb: number | undefined;
  jitter: number;
  loudnessMean: number;
  loudnessStddevNorm: number;
  shimmer: number;
}

type PatternList = readonly (readonly string[])[];

const JITTER_PATTERNS: PatternList = [
  ['jitterlocal', 'amean'],
  ['jitterlocal', 'stddevnorm'],
  ['jitterlocal'],
  ['jitter', 'amean'],
  ['jitter'],
];

const SHIMMER_PATTERNS: PatternList = [
  ['shimmerlocaldb', 'amean'],
  ['shimmerlocal', 'amean'],
  ['shimmerlocaldb'],
  ['shimmerlocal'],
  ['shimmer', 'amean'],
  ['shimmer'],
];

const HNR_PATTERNS: PatternList = [
  ['hnrdbacf', 'amean'],
  ['hnrdbacf'],
  ['hnr', 'amean'],
  ['hnr'],
];

const F0_RANGE_PATTERNS: PatternList = [
  ['f0semitone', 'pctlrange'],
  ['f0semitone', 'percentilerange'],
  ['f0semitone', 'range'],
  ['f0semitone', 'stddevnorm'],
];

const F0_MEAN_PATTERNS: PatternList = [
  ['f0semitone', 'amean'],
  ['f0semitone', 'mean'],
];

const LOUDNESS_STD_PATTERNS: PatternList = [
  ['loudness', 'stddevnorm'],
  ['loudness', 'stddev'],
  ['loudness', 'variance'],
];

const LOUDNESS_MEAN_PATTERNS: PatternList = [
  ['loudness', 'amean'],
  ['loudness', 'mean'],
  ['loudness', 'sma3', 'amean'],
];

const LEQ_PATTERNS: PatternList = [
  ['equivalentsoundlevel'],
  ['equivalent', 'sound', 'level'],
  ['leq'],
];

function keyMatches(key: string, parts: readonly string[]): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return parts.every((part) => normalized.includes(part.toLowerCase().replace(/[^a-z0-9]/g, '')));
}

export function findEgmapsValue(
  features: Record<string, number>,
  patternList: PatternList,
): number | undefined {
  const keys = Object.keys(features);
  for (const parts of patternList) {
    const hit = keys.find((k) => keyMatches(k, parts));
    if (hit == null) {
      continue;
    }
    const value = features[hit];
    if (value !== undefined && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function absOrZero(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Math.abs(value);
}

/**
 * merged — усреднение по шагам протокола; phrase — фраза (динамика), если есть отдельно.
 */
export function extractEgmapsAcousticSignals(
  merged: Record<string, number>,
  phrase?: Record<string, number> | undefined,
): EgmapsAcousticSignals {
  const phraseFeatures = phrase ?? merged;

  const jitter = absOrZero(findEgmapsValue(merged, JITTER_PATTERNS));
  const shimmer = absOrZero(findEgmapsValue(merged, SHIMMER_PATTERNS));
  const hnrDb = findEgmapsValue(merged, HNR_PATTERNS);

  const f0RangeRaw = findEgmapsValue(phraseFeatures, F0_RANGE_PATTERNS);
  const f0SemitoneRange =
    f0RangeRaw !== undefined
      ? Math.abs(f0RangeRaw)
      : absOrZero(findEgmapsValue(phraseFeatures, [['f0semitone', 'stddevnorm']])) * 4;

  const f0SemitoneMean = findEgmapsValue(phraseFeatures, F0_MEAN_PATTERNS);

  const loudnessStddevNorm = absOrZero(findEgmapsValue(phraseFeatures, LOUDNESS_STD_PATTERNS));
  const loudnessMean = absOrZero(findEgmapsValue(phraseFeatures, LOUDNESS_MEAN_PATTERNS));
  const equivalentSoundLevelDb = findEgmapsValue(merged, LEQ_PATTERNS);

  return {
    equivalentSoundLevelDb,
    f0SemitoneMean,
    f0SemitoneRange,
    hnrDb,
    jitter,
    loudnessMean,
    loudnessStddevNorm,
    shimmer,
  };
}

/** true, если CSV распарсен в отдельные колонки и есть ненулевые акустические сигналы. */
export function hasUsableEgmapsSignals(
  signals: EgmapsAcousticSignals,
  featureColumnCount: number,
): boolean {
  if (featureColumnCount < 8) {
    return false;
  }
  if (signals.jitter > 0 || signals.shimmer > 0) {
    return true;
  }
  if (signals.f0SemitoneRange > 0.05 || signals.loudnessStddevNorm > 0.01) {
    return true;
  }
  if (signals.hnrDb !== undefined && Number.isFinite(signals.hnrDb) && signals.hnrDb !== 0) {
    return true;
  }
  if (
    signals.equivalentSoundLevelDb !== undefined &&
    Number.isFinite(signals.equivalentSoundLevelDb) &&
    signals.equivalentSoundLevelDb !== 0
  ) {
    return true;
  }
  return false;
}
