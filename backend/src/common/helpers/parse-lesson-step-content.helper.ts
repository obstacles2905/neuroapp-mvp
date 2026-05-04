import { BiometricsMetric } from '../enums/biometrics-metric.enum';
import { BiometricsPhase } from '../enums/biometrics-phase.enum';
import { LessonStepType } from '../enums/lesson-step-type.enum';
import type { AnimationStepContent } from '../interfaces/animation-step-content.interface';
import type { BiometricsStepContent } from '../interfaces/biometrics-step-content.interface';
import type { PracticeStepContent } from '../interfaces/practice-step-content.interface';
import type { TheoryDisplayMode } from '../interfaces/theory-step-content.interface';
import type { TheoryStepContent } from '../interfaces/theory-step-content.interface';
import type { VideoStepContent } from '../interfaces/video-step-content.interface';
import type {
  LocalizedStringArrays,
  LocalizedText,
} from '../types/localized-text.type';
import type { LessonStepContentParseResult } from '../types/lesson-step-content-parse-result.type';
import { isPlainRecord } from './is-plain-record.helper';

export function parseLessonStepContent(
  type: LessonStepType,
  raw: unknown,
): LessonStepContentParseResult {
  if (!isPlainRecord(raw)) {
    return {
      success: false,
      errorMessage: 'content must be a non-null object',
    };
  }
  switch (type) {
    case LessonStepType.THEORY:
      return parseTheoryContent(raw);
    case LessonStepType.ANIMATION:
      return parseAnimationContent(raw);
    case LessonStepType.VIDEO:
      return parseVideoContent(raw);
    case LessonStepType.PRACTICE:
      return parsePracticeContent(raw);
    case LessonStepType.BIOMETRICS:
      return parseBiometricsContent(raw);
    default:
      return { success: false, errorMessage: 'unsupported step type' };
  }
}

function parseTheoryContent(
  raw: Record<string, unknown>,
): LessonStepContentParseResult {
  const modeRaw = raw.display_mode;
  if (modeRaw !== 'all' && modeRaw !== 'step_by_step') {
    return {
      success: false,
      errorMessage: 'theory.display_mode must be "all" or "step_by_step"',
    };
  }
  const sentencesResult = parseLocalizedStringArrays(raw.sentences);
  if (!sentencesResult.ok) {
    return { success: false, errorMessage: sentencesResult.errorMessage };
  }
  const content: TheoryStepContent = {
    display_mode: modeRaw as TheoryDisplayMode,
    sentences: sentencesResult.value,
  };
  return { success: true, content };
}

function parseLocalizedStringArrays(
  raw: unknown,
):
  | { ok: true; value: LocalizedStringArrays }
  | { ok: false; errorMessage: string } {
  if (!isPlainRecord(raw)) {
    return { ok: false, errorMessage: 'sentences must be an object' };
  }
  const ru = parseStringArray(raw.ru);
  const uk = parseStringArray(raw.uk);
  const en = parseStringArray(raw.en);
  if (!ru.ok || !uk.ok || !en.ok) {
    return {
      ok: false,
      errorMessage: 'sentences.ru, .uk, .en must be string arrays',
    };
  }
  return { ok: true, value: { ru: ru.value, uk: uk.value, en: en.value } };
}

function parseStringArray(
  raw: unknown,
): { ok: true; value: string[] } | { ok: false; errorMessage: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, errorMessage: 'expected array' };
  }
  if (!raw.every((item) => typeof item === 'string')) {
    return { ok: false, errorMessage: 'expected string[]' };
  }
  return { ok: true, value: raw };
}

function parseLocalizedText(
  raw: unknown,
  fieldLabel: string,
): { ok: true; value: LocalizedText } | { ok: false; errorMessage: string } {
  if (!isPlainRecord(raw)) {
    return { ok: false, errorMessage: `${fieldLabel} must be an object` };
  }
  const ru = raw.ru;
  const uk = raw.uk;
  const en = raw.en;
  if (
    typeof ru !== 'string' ||
    typeof uk !== 'string' ||
    typeof en !== 'string'
  ) {
    return {
      ok: false,
      errorMessage: `${fieldLabel}.ru, .uk, .en must be strings`,
    };
  }
  return { ok: true, value: { ru, uk, en } };
}

function parseAnimationContent(
  raw: Record<string, unknown>,
): LessonStepContentParseResult {
  if (typeof raw.s3_key !== 'string') {
    return {
      success: false,
      errorMessage: 'animation.s3_key must be a string',
    };
  }
  const desc = parseLocalizedText(raw.description, 'animation.description');
  if (!desc.ok) {
    return { success: false, errorMessage: desc.errorMessage };
  }
  const content: AnimationStepContent = {
    s3_key: raw.s3_key,
    description: desc.value,
  };
  return { success: true, content };
}

function parseVideoContent(
  raw: Record<string, unknown>,
): LessonStepContentParseResult {
  if (typeof raw.s3_key !== 'string') {
    return { success: false, errorMessage: 'video.s3_key must be a string' };
  }
  const title = parseLocalizedText(raw.title, 'video.title');
  if (!title.ok) {
    return { success: false, errorMessage: title.errorMessage };
  }
  const content: VideoStepContent = { s3_key: raw.s3_key, title: title.value };
  return { success: true, content };
}

function parsePracticeContent(
  raw: Record<string, unknown>,
): LessonStepContentParseResult {
  if (
    typeof raw.duration_seconds !== 'number' ||
    !Number.isFinite(raw.duration_seconds)
  ) {
    return {
      success: false,
      errorMessage: 'practice.duration_seconds must be a number',
    };
  }
  if (raw.duration_seconds < 0) {
    return {
      success: false,
      errorMessage: 'practice.duration_seconds must be non-negative',
    };
  }
  const instruction = parseLocalizedText(
    raw.instruction,
    'practice.instruction',
  );
  if (!instruction.ok) {
    return { success: false, errorMessage: instruction.errorMessage };
  }
  const content: PracticeStepContent = {
    duration_seconds: raw.duration_seconds,
    instruction: instruction.value,
  };
  return { success: true, content };
}

function parseBiometricsContent(
  raw: Record<string, unknown>,
): LessonStepContentParseResult {
  const phase = raw.phase;
  const metric = raw.metric;
  if (phase !== 'before' && phase !== 'after') {
    return {
      success: false,
      errorMessage: 'biometrics.phase must be "before" or "after"',
    };
  }
  if (metric !== 'heart_rate') {
    return {
      success: false,
      errorMessage: 'biometrics.metric must be "heart_rate"',
    };
  }
  const content: BiometricsStepContent = {
    phase: phase as BiometricsPhase,
    metric: metric as BiometricsMetric,
  };
  return { success: true, content };
}
