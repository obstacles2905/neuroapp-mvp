import { LessonStepType } from '../enums/lesson-step-type.enum';
import type { TheoryStepContent } from '../interfaces/theory-step-content.interface';
import { parseLessonStepContent } from './parse-lesson-step-content.helper';

describe('parseLessonStepContent', () => {
  it('accepts valid theory payload', () => {
    expect.assertions(2);
    const raw = {
      display_mode: 'all',
      sentences: { ru: ['a'], uk: [], en: [] },
    };
    const result = parseLessonStepContent(LessonStepType.THEORY, raw);
    expect(result.success).toBe(true);
    if (result.success) {
      const theory = result.content as TheoryStepContent;
      expect(theory.display_mode).toBe('all');
    }
  });

  it('rejects theory when display_mode invalid', () => {
    expect.assertions(1);
    const raw = {
      display_mode: 'invalid',
      sentences: { ru: [], uk: [], en: [] },
    };
    const result = parseLessonStepContent(LessonStepType.THEORY, raw);
    expect(result.success).toBe(false);
  });
});
