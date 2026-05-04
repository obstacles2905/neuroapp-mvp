import { LessonStepBuilder } from '@/components/lesson-builder/lesson-step-builder';
import { apiGet } from '@/lib/api/server-client';
import type { LessonWithBlocks } from '@/lib/types/api';

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonBuilderPage(props: PageProps) {
  const { lessonId } = await props.params;
  const lesson = await apiGet<LessonWithBlocks>(`/lessons/${lessonId}`);
  const initial: LessonWithBlocks = {
    ...lesson,
    blocks: lesson.blocks ?? [],
  };

  return <LessonStepBuilder lessonId={lessonId} initialLesson={initial} />;
}
