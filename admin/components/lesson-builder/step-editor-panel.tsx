'use client';

import {
  deleteLessonStepAction,
  updateLessonStepAction,
} from '@/app/actions/lesson-steps';
import { LocaleTabBar } from '@/components/lesson-builder/locale-tab-bar';
import { MediaUploadField } from '@/components/lesson-builder/media-upload-field';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ContentLocale } from '@/lib/locale';
import { useLessonBuilderStore } from '@/lib/stores/lesson-builder-store';
import type {
  AnimationStepContent,
  BiometricsStepContent,
  LessonStep,
  LessonStepContent,
  LessonStepType,
  LocalizedText,
  PracticeStepContent,
  TheoryStepContent,
  VideoStepContent,
} from '@/lib/types/lesson-step';
import { deepEqual } from '@/lib/helpers/deep-equal';
import { defaultContentForType, LESSON_STEP_LABELS } from '@/lib/types/lesson-step';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function ensureLocalizedText(
  input: LocalizedText | null | undefined,
): LocalizedText {
  return {
    ru: input?.ru ?? '',
    uk: input?.uk ?? '',
    en: input?.en ?? '',
  };
}

function emptyTheorySentences(): TheoryStepContent['sentences'] {
  return { ru: [], uk: [], en: [] };
}

function ensureTheorySentences(
  input: TheoryStepContent['sentences'] | null | undefined,
): TheoryStepContent['sentences'] {
  const d = emptyTheorySentences();
  if (!input || typeof input !== 'object') {
    return d;
  }
  return {
    ru: Array.isArray(input.ru) ? input.ru : d.ru,
    uk: Array.isArray(input.uk) ? input.uk : d.uk,
    en: Array.isArray(input.en) ? input.en : d.en,
  };
}

function normalizeDraftForEditor(
  type: LessonStepType,
  content: LessonStepContent,
): LessonStepContent {
  const defaults = defaultContentForType(type);
  if (type === 'video') {
    const c = content as VideoStepContent;
    const d = defaults as VideoStepContent;
    return {
      s3_key: typeof c.s3_key === 'string' ? c.s3_key : d.s3_key,
      title: ensureLocalizedText(c.title ?? d.title),
    };
  }
  if (type === 'animation') {
    const c = content as AnimationStepContent;
    const d = defaults as AnimationStepContent;
    return {
      s3_key: typeof c.s3_key === 'string' ? c.s3_key : d.s3_key,
      description: ensureLocalizedText(c.description ?? d.description),
    };
  }
  if (type === 'practice') {
    const c = content as PracticeStepContent;
    const d = defaults as PracticeStepContent;
    const sec = c.duration_seconds;
    return {
      duration_seconds:
        typeof sec === 'number' && Number.isFinite(sec) ? Math.max(0, sec) : d.duration_seconds,
      instruction: ensureLocalizedText(c.instruction ?? d.instruction),
    };
  }
  if (type === 'theory') {
    const c = content as TheoryStepContent;
    const d = defaults as TheoryStepContent;
    const s = c.sentences ?? d.sentences;
    return {
      display_mode:
        c.display_mode === 'all' || c.display_mode === 'step_by_step'
          ? c.display_mode
          : d.display_mode,
      sentences: {
        ru: Array.isArray(s.ru) ? s.ru : d.sentences.ru,
        uk: Array.isArray(s.uk) ? s.uk : d.sentences.uk,
        en: Array.isArray(s.en) ? s.en : d.sentences.en,
      },
    };
  }
  if (type === 'biometrics') {
    const c = content as BiometricsStepContent;
    return {
      phase: c.phase === 'before' || c.phase === 'after' ? c.phase : 'before',
      metric: c.metric === 'heart_rate' ? c.metric : 'heart_rate',
    };
  }
  return content;
}

function LocalizedTextarea({
  value,
  onChange,
  rows,
}: {
  value: LocalizedText | null | undefined;
  onChange: (next: LocalizedText) => void;
  rows?: number;
}) {
  const [locale, setLocale] = useState<ContentLocale>('ru');
  const safe = ensureLocalizedText(value);
  return (
    <div className="space-y-2">
      <LocaleTabBar active={locale} onChange={setLocale} />
      <textarea
        className="input-admin min-h-[96px] resize-y"
        rows={rows ?? 4}
        value={safe[locale]}
        onChange={(e) =>
          onChange({ ...safe, [locale]: e.target.value })
        }
      />
    </div>
  );
}

function TheoryFields({
  content,
  onChange,
}: {
  content: TheoryStepContent;
  onChange: (c: TheoryStepContent) => void;
}) {
  const [locale, setLocale] = useState<ContentLocale>('ru');
  const sentences = ensureTheorySentences(content.sentences);
  const linesForLocale = sentences[locale] ?? [];
  const text = linesForLocale.join('\n');
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="theory-mode" className="text-sm font-medium text-foreground">
          Режим показа
        </label>
        <select
          id="theory-mode"
          className="input-admin w-full max-w-xs"
          value={content.display_mode ?? 'all'}
          onChange={(e) =>
            onChange({
              ...content,
              display_mode: e.target.value as TheoryStepContent['display_mode'],
              sentences: ensureTheorySentences(content.sentences),
            })
          }
        >
          <option value="all">Весь текст сразу</option>
          <option value="step_by_step">По блокам (строка = блок)</option>
        </select>
      </div>
      <div className="space-y-2">
        <LocaleTabBar
          active={locale}
          onChange={setLocale}
          label="Текст по языкам (каждая строка — отдельный блок)"
        />
        <textarea
          className="input-admin min-h-[140px] resize-y text-sm"
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            const lines = raw === '' ? [] : raw.split(/\r?\n/);
            onChange({
              ...content,
              sentences: { ...sentences, [locale]: lines },
            });
          }}
        />
      </div>
    </div>
  );
}

function VideoFields({
  content,
  onChange,
}: {
  content: VideoStepContent;
  onChange: (c: VideoStepContent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="video-key" className="text-sm font-medium text-foreground">
          Ключ в S3 (s3_key)
        </label>
        <input
          id="video-key"
          className="input-admin font-mono text-xs"
          value={content.s3_key ?? ''}
          onChange={(e) => onChange({ ...content, s3_key: e.target.value })}
          placeholder="videos/…"
        />
      </div>
      <MediaUploadField
        folder="videos"
        label="Загрузить видео"
        onUploaded={(s3Key) => onChange({ ...content, s3_key: s3Key })}
      />
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Заголовок</span>
        <LocalizedTextarea
          value={ensureLocalizedText(content.title)}
          onChange={(title) => onChange({ ...content, title })}
          rows={2}
        />
      </div>
    </div>
  );
}

function AnimationFields({
  content,
  onChange,
}: {
  content: AnimationStepContent;
  onChange: (c: AnimationStepContent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="anim-key" className="text-sm font-medium text-foreground">
          Ключ в S3 (s3_key)
        </label>
        <input
          id="anim-key"
          className="input-admin font-mono text-xs"
          value={content.s3_key ?? ''}
          onChange={(e) => onChange({ ...content, s3_key: e.target.value })}
          placeholder="animations/…"
        />
      </div>
      <MediaUploadField
        folder="animations"
        label="Загрузить файл анимации / видео"
        onUploaded={(s3Key) => onChange({ ...content, s3_key: s3Key })}
      />
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Описание</span>
        <LocalizedTextarea
          value={ensureLocalizedText(content.description)}
          onChange={(description) => onChange({ ...content, description })}
        />
      </div>
    </div>
  );
}

function PracticeFields({
  content,
  onChange,
}: {
  content: PracticeStepContent;
  onChange: (c: PracticeStepContent) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="practice-dur" className="text-sm font-medium text-foreground">
          Длительность (сек)
        </label>
        <input
          id="practice-dur"
          type="number"
          min={0}
          className="input-admin max-w-[10rem]"
          value={content.duration_seconds ?? 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange({
              ...content,
              duration_seconds: Number.isFinite(n) ? Math.max(0, n) : 0,
            });
          }}
        />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Инструкция</span>
        <LocalizedTextarea
          value={ensureLocalizedText(content.instruction)}
          onChange={(instruction) => onChange({ ...content, instruction })}
        />
      </div>
    </div>
  );
}

function BiometricsFields({
  content,
  onChange,
}: {
  content: BiometricsStepContent;
  onChange: (c: BiometricsStepContent) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="bio-phase" className="text-sm font-medium text-foreground">
          Фаза
        </label>
        <select
          id="bio-phase"
          className="input-admin"
          value={content.phase ?? 'before'}
          onChange={(e) =>
            onChange({
              ...content,
              phase: e.target.value as BiometricsStepContent['phase'],
            })
          }
        >
          <option value="before">До практики</option>
          <option value="after">После практики</option>
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="bio-metric" className="text-sm font-medium text-foreground">
          Метрика
        </label>
        <select
          id="bio-metric"
          className="input-admin"
          value={content.metric ?? 'heart_rate'}
          onChange={() =>
            onChange({
              ...content,
              metric: 'heart_rate',
            })
          }
        >
          <option value="heart_rate">Пульс (heart_rate)</option>
        </select>
      </div>
    </div>
  );
}

export function StepEditorPanel({
  lessonId,
  blockId,
  step,
  updateStep = updateLessonStepAction,
  deleteStep = deleteLessonStepAction,
}: {
  lessonId: string;
  blockId: string | null;
  step: LessonStep | null;
  updateStep?: typeof updateLessonStepAction;
  deleteStep?: typeof deleteLessonStepAction;
}) {
  const router = useRouter();
  const upsertSlide = useLessonBuilderStore((s) => s.upsertSlide);
  const removeSlideFromStore = useLessonBuilderStore((s) => s.removeSlide);

  const [draft, setDraft] = useState<LessonStepContent | null>(() =>
    step && blockId ? normalizeDraftForEditor(step.type, step.content) : null,
  );
  const [savedBaseline, setSavedBaseline] = useState<LessonStepContent | null>(() =>
    step && blockId ? normalizeDraftForEditor(step.type, step.content) : null,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { feedback, notify } = useFeedbackToast();

  useEffect(() => {
    if (!step) {
      setDraft(null);
      setSavedBaseline(null);
      return;
    }
    const baseline = normalizeDraftForEditor(step.type, step.content);
    setDraft(baseline);
    setSavedBaseline(baseline);
  }, [step?.id, step?.updatedAt]);

  const isDirty = useMemo(() => {
    if (draft === null || savedBaseline === null) {
      return false;
    }
    return !deepEqual(draft, savedBaseline);
  }, [draft, savedBaseline]);

  async function save() {
    if (!step || draft === null || !blockId) {
      return;
    }
    setSaving(true);
    try {
      const updated = await updateStep(lessonId, blockId, step.id, {
        type: step.type,
        content: draft,
      });
      const normalized = normalizeDraftForEditor(updated.type, updated.content);
      setDraft(normalized);
      setSavedBaseline(normalized);
      upsertSlide(blockId, updated);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Сохранено',
        message: 'Изменения слайда записаны на сервер.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось сохранить',
        message: e instanceof Error ? e.message : 'Проверьте данные и попробуйте снова.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !step ||
      !blockId ||
      !globalThis.confirm('Удалить этот слайд? Это действие нельзя отменить.')
    ) {
      return;
    }
    setDeleting(true);
    try {
      await deleteStep(lessonId, blockId, step.id);
      removeSlideFromStore(blockId, step.id);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Слайд удалён',
        message: 'Слайд убран из блока.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось удалить',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setDeleting(false);
    }
  }

  if (!step || draft === null || savedBaseline === null || !blockId) {
    return (
      <>
        {feedback}
        <Card className="border-border/80 border-dashed shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">Редактор слайда</CardTitle>
            <CardDescription>
              Выберите слайд в одном из блоков слева или добавьте новый.
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  return (
    <>
      {feedback}
      <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {LESSON_STEP_LABELS[step.type]}
        </CardTitle>
        <CardDescription className="font-mono text-xs">id: {step.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step.type === 'theory' ? (
          <TheoryFields
            content={draft as TheoryStepContent}
            onChange={(c) => setDraft(c)}
          />
        ) : null}
        {step.type === 'video' ? (
          <VideoFields
            content={draft as VideoStepContent}
            onChange={(c) => setDraft(c)}
          />
        ) : null}
        {step.type === 'animation' ? (
          <AnimationFields
            content={draft as AnimationStepContent}
            onChange={(c) => setDraft(c)}
          />
        ) : null}
        {step.type === 'practice' ? (
          <PracticeFields
            content={draft as PracticeStepContent}
            onChange={(c) => setDraft(c)}
          />
        ) : null}
        {step.type === 'biometrics' ? (
          <BiometricsFields
            content={draft as BiometricsStepContent}
            onChange={(c) => setDraft(c)}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 bg-muted/20 pt-4">
        <Button
          type="button"
          disabled={saving || !isDirty}
          onClick={() => void save()}
        >
          {saving ? 'Сохранение…' : isDirty ? 'Сохранить' : 'Нет изменений'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deleting}
          onClick={() => void remove()}
        >
          {deleting ? 'Удаление…' : 'Удалить слайд'}
        </Button>
      </CardFooter>
    </Card>
    </>
  );
}
