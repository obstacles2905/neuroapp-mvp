import { MIN_PUBLISH_PRACTICE_DURATION_SECONDS } from '../constants/lesson-publish.constant';
import type { LessonBlock } from '../entity/lesson-block.entity';
import type { LessonStep } from '../entity/lesson-step.entity';
import { LessonStepType } from '../enums/lesson-step-type.enum';
import type { AnimationStepContent } from '../interfaces/animation-step-content.interface';
import type { PracticeStepContent } from '../interfaces/practice-step-content.interface';
import type { TheoryStepContent } from '../interfaces/theory-step-content.interface';
import type { VideoStepContent } from '../interfaces/video-step-content.interface';

export function getFirstLessonPublishBlocker(
  blocks: LessonBlock[] | undefined,
): string | null {
  if (!blocks || blocks.length === 0) {
    return 'Lesson must have content blocks';
  }
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  for (const block of sortedBlocks) {
    const slides = block.slides ?? [];
    if (slides.length === 0) {
      return `Content block "${block.blockType}" must have at least one slide`;
    }
    const sortedSlides = [...slides].sort((a, b) => a.order - b.order);
    for (const slide of sortedSlides) {
      const stepError = getStepPublishBlocker(slide);
      if (stepError) {
        return stepError;
      }
    }
  }
  return null;
}

function getStepPublishBlocker(step: LessonStep): string | null {
  switch (step.type) {
    case LessonStepType.THEORY:
      return theoryBlocker(step.content as TheoryStepContent);
    case LessonStepType.ANIMATION:
      return animationBlocker(step.content as AnimationStepContent);
    case LessonStepType.VIDEO:
      return videoBlocker(step.content as VideoStepContent);
    case LessonStepType.PRACTICE:
      return practiceBlocker(step.content as PracticeStepContent);
    case LessonStepType.BIOMETRICS:
      return biometricsBlocker();
    default:
      return 'Unsupported step type';
  }
}

function theoryBlocker(content: TheoryStepContent): string | null {
  const locales = ['ru', 'uk', 'en'] as const;
  let hasSentence = false;
  for (const loc of locales) {
    const arr = content.sentences[loc];
    if (!Array.isArray(arr)) {
      return 'Theory step sentences must be arrays for each locale';
    }
    for (const line of arr) {
      if (typeof line === 'string' && line.trim().length > 0) {
        hasSentence = true;
      }
    }
  }
  if (!hasSentence) {
    return 'Theory step must contain at least one non-empty sentence';
  }
  return null;
}

function animationBlocker(content: AnimationStepContent): string | null {
  if (!content.s3_key || content.s3_key.trim().length === 0) {
    return 'Animation step requires a non-empty s3_key';
  }
  return localizedAllNonEmpty(content.description, 'Animation description');
}

function videoBlocker(content: VideoStepContent): string | null {
  if (!content.s3_key || content.s3_key.trim().length === 0) {
    return 'Video step requires a non-empty s3_key';
  }
  return localizedAllNonEmpty(content.title, 'Video title');
}

function practiceBlocker(content: PracticeStepContent): string | null {
  if (content.duration_seconds < MIN_PUBLISH_PRACTICE_DURATION_SECONDS) {
    return `Practice step duration_seconds must be at least ${MIN_PUBLISH_PRACTICE_DURATION_SECONDS}`;
  }
  return localizedAllNonEmpty(content.instruction, 'Practice instruction');
}

function biometricsBlocker(): string | null {
  return null;
}

function localizedAllNonEmpty(
  text: { ru: string; uk: string; en: string },
  label: string,
): string | null {
  const locales = ['ru', 'uk', 'en'] as const;
  for (const loc of locales) {
    if (!text[loc] || text[loc].trim().length === 0) {
      return `${label} must be non-empty for ${loc}`;
    }
  }
  return null;
}
