import { NewMndExerciseForm } from '@/components/mnd/new-mnd-exercise-form';
import { apiGet } from '@/lib/api/server-client';
import type { MndMasterStack } from '@/lib/types/api';
import Link from 'next/link';

export default async function NewMndExercisePage() {
  const stacks = await apiGet<MndMasterStack[]>('/mnd/master-stacks');

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/mnd"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← MND Protocol
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
          Новое упражнение
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Привяжите упражнение к стеку, направлению и уровню сложности.
        </p>
      </div>
      <NewMndExerciseForm stacks={stacks} />
    </div>
  );
}
