import { MndExerciseBuilder } from '@/components/mnd/mnd-exercise-builder';
import { apiGet } from '@/lib/api/server-client';
import type { MndExercise } from '@/lib/types/api';

type PageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function MndExerciseBuilderPage(props: PageProps) {
  const { exerciseId } = await props.params;
  const exercise = await apiGet<MndExercise>(`/mnd/exercises/${exerciseId}`);

  return <MndExerciseBuilder initialExercise={exercise} />;
}
