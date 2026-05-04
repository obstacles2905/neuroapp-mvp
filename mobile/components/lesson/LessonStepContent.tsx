import { InlineMediaPlayer } from '@/components/lesson/InlineMediaPlayer';
import type { AppLessonStep, AppLessonStepType } from '@/lib/api/types/lessons.types';
import type { AppTokens } from '@/constants/theme';
import { pickLocalized, pickLocalizedSentences } from '@/lib/i18n/pick-localized';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useMemo, type JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type LocalizedStringArrays = {
  ru: string[];
  uk: string[];
  en: string[];
};

type TheoryContent = {
  display_mode?: string;
  sentences?: LocalizedStringArrays;
};

type PracticeContent = {
  duration_seconds?: number;
  instruction?: { ru: string; uk: string; en: string };
};

type LessonStepStyles = ReturnType<typeof createLessonStepStyles>;

function readMediaUrl(c: Record<string, unknown>): string | null {
  const m = c.mediaUrl;
  return typeof m === 'string' && m.length > 0 ? m : null;
}

function renderTheory(
  c: Record<string, unknown>,
  styles: LessonStepStyles,
): JSX.Element {
  const raw = c as unknown as TheoryContent;
  const sentences = raw.sentences
    ? pickLocalizedSentences(raw.sentences)
    : [];
  if (sentences.length === 0) {
    return (
      <Text style={styles.muted}>Нет текста для отображения.</Text>
    );
  }
  return (
    <View>
      {sentences.map((line, i) => (
        <Text key={i} style={styles.body}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function renderVideo(c: Record<string, unknown>, styles: LessonStepStyles): JSX.Element {
  const url = readMediaUrl(c);
  const title = c.title as { ru: string; uk: string; en: string } | undefined;
  const label = title ? pickLocalized(title) : 'Видео';
  if (!url) {
    return <Text style={styles.muted}>Видео ещё не прикреплено.</Text>;
  }
  return (
    <View>
      <Text style={styles.h2}>{label}</Text>
      <InlineMediaPlayer url={url} />
    </View>
  );
}

function renderAnimation(
  c: Record<string, unknown>,
  styles: LessonStepStyles,
): JSX.Element {
  const url = readMediaUrl(c);
  const desc = c.description as { ru: string; uk: string; en: string } | undefined;
  const descriptionText = desc ? pickLocalized(desc) : '';
  if (!url) {
    return (
      <Text style={styles.muted}>Анимация ещё не прикреплена.</Text>
    );
  }
  return (
    <View>
      {descriptionText.length > 0 ? (
        <Text style={styles.body}>{descriptionText}</Text>
      ) : null}
      <InlineMediaPlayer url={url} />
    </View>
  );
}

function renderPractice(
  c: Record<string, unknown>,
  styles: LessonStepStyles,
): JSX.Element {
  const raw = c as unknown as PracticeContent;
  const sec = raw.duration_seconds ?? 0;
  const instruction = raw.instruction
    ? pickLocalized(raw.instruction)
    : '';
  return (
    <View>
      {instruction.length > 0 ? (
        <Text style={styles.body}>{instruction}</Text>
      ) : null}
      <Text style={styles.caption}>Рекомендуемая длительность: {sec} с</Text>
    </View>
  );
}

type Props = {
  step: AppLessonStep;
};

const TYPE_LABEL: Record<AppLessonStepType, string> = {
  theory: 'Теория',
  video: 'Видео',
  animation: 'Анимация',
  practice: 'Практика',
  biometrics: 'Биометрия',
};

export function LessonStepContent(props: Props): JSX.Element {
  const { step } = props;
  const theme = useAppTheme();
  const styles = useMemo(() => createLessonStepStyles(theme), [theme]);

  const byType = useMemo(() => {
    const t = step.type;
    if (t === 'theory') {
      return renderTheory(step.content, styles);
    }
    if (t === 'video') {
      return renderVideo(step.content, styles);
    }
    if (t === 'animation') {
      return renderAnimation(step.content, styles);
    }
    if (t === 'practice') {
      return renderPractice(step.content, styles);
    }
    return (
      <Text style={styles.muted}>
        Замеры в приложении в MVP недоступны. Пропустите шаг.
      </Text>
    );
  }, [step, styles]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.badge}>{TYPE_LABEL[step.type]}</Text>
      {byType}
    </View>
  );
}

function createLessonStepStyles(t: AppTokens) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: t.tintMuted,
      borderRadius: 8,
      color: t.link,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 12,
      overflow: 'hidden',
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    body: {
      color: t.text,
      fontSize: 16,
      lineHeight: 25,
      marginBottom: 10,
    },
    caption: {
      color: t.textSecondary,
      fontSize: 14,
      marginTop: 8,
    },
    h2: {
      color: t.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 8,
      letterSpacing: -0.2,
    },
    muted: {
      color: t.textMuted,
      fontSize: 15,
      lineHeight: 21,
    },
    wrap: {
      flex: 1,
    },
  });
}
