import {
  updateMndExercisePublishedAction,
  updateMndStackActiveAction,
  updateMndSymptomPublishedAction,
} from '@/app/actions/mnd';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiGet } from '@/lib/api/server-client';
import type {
  LocalizedText,
  MndExercise,
  MndMasterStack,
  MndMatrixRule,
  MndSymptom,
} from '@/lib/types/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function text(value?: LocalizedText | null): string {
  if (!value) {
    return '—';
  }
  return value.ru || value.uk || value.en || '—';
}

function directionLabel(direction: MndExercise['direction']): string {
  return direction === 'bottom_up' ? 'Bottom-Up' : 'Top-Down';
}

function stackLabel(stack: MndMasterStack | undefined, fallbackId: string): string {
  if (!stack) {
    return fallbackId.slice(0, 8);
  }
  return `${stack.code} · ${text(stack.title)}`;
}

export default async function MndPage() {
  const [stacks, symptoms, matrixRules, exercises] = await Promise.all([
    apiGet<MndMasterStack[]>('/mnd/master-stacks'),
    apiGet<MndSymptom[]>('/mnd/symptoms'),
    apiGet<MndMatrixRule[]>('/mnd/matrix-rules'),
    apiGet<MndExercise[]>('/mnd/exercises'),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            MND Protocol
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Управление симптомами, мастер-стеками, MND-матрицей и библиотекой упражнений.
          </p>
        </div>
        <Link href="/mnd/exercises/new" className={cn(buttonVariants())}>
          Новое упражнение
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Мастер-стеки" value={stacks.length} hint="ST-1 ... ST-6" />
        <MetricCard title="Симптомы" value={symptoms.length} hint="Онбординг MND" />
        <MetricCard title="Правила матрицы" value={matrixRules.length} hint="Веса и стеки" />
        <MetricCard title="Упражнения" value={exercises.length} hint="Контентная библиотека" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Мастер-стеки</CardTitle>
            <CardDescription>Глобальные корзины упражнений MND.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stacks.map((stack) => (
                  <TableRow key={stack.id}>
                    <TableCell className="font-mono font-medium">{stack.code}</TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="font-medium">{text(stack.title)}</div>
                      <div className="text-xs text-muted-foreground">{text(stack.description)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stack.isActive ? 'default' : 'secondary'}>
                        {stack.isActive ? 'Active' : 'Off'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={updateMndStackActiveAction.bind(null, stack.id, !stack.isActive)}>
                        <button className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                          {stack.isActive ? 'Деактивировать' : 'Активировать'}
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Симптомы</CardTitle>
            <CardDescription>20 типовых симптомов для будущего онбординга.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[520px] overflow-auto pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Симптом</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {symptoms.map((symptom) => (
                    <TableRow key={symptom.id}>
                      <TableCell className="font-mono text-xs">{symptom.code}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="font-medium">{text(symptom.title)}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {text(symptom.description)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={symptom.isPublished ? 'default' : 'secondary'}>
                          {symptom.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <form
                          action={updateMndSymptomPublishedAction.bind(
                            null,
                            symptom.id,
                            !symptom.isPublished,
                          )}
                        >
                          <button className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                            {symptom.isPublished ? 'Скрыть' : 'Опубликовать'}
                          </button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>MND-матрица</CardTitle>
          <CardDescription>
            Lookup table: симптом → целевое действие → веса → приоритетные стеки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Симптом</TableHead>
                <TableHead>Веса</TableHead>
                <TableHead>Стеки</TableHead>
                <TableHead>Целевое действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{text(rule.symptom?.title)}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {rule.symptom?.code ?? rule.symptomId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">B-Up {rule.bottomUpPercent}%</Badge>
                      <Badge variant="secondary">T-Down {rule.topDownPercent}%</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {rule.stacks.map((stack) => (
                        <Badge key={stack.id} variant="outline">
                          {stack.masterStack?.code ?? stack.masterStackId.slice(0, 8)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xl whitespace-normal text-sm">
                    {text(rule.targetAction)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Упражнения</CardTitle>
            <CardDescription>
              180 микро-упражнений будут заполняться здесь. Сейчас таблица пустая после reset.
            </CardDescription>
          </div>
          <Link href="/mnd/exercises/new" className={cn(buttonVariants({ variant: 'outline' }))}>
            Добавить
          </Link>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Упражнений пока нет. Создайте первое упражнение и привяжите его к мастер-стеку.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Стек</TableHead>
                  <TableHead>Направление</TableHead>
                  <TableHead>Сложность</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="whitespace-normal font-medium">
                      {text(exercise.title)}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {stackLabel(exercise.masterStack, exercise.masterStackId)}
                    </TableCell>
                    <TableCell>{directionLabel(exercise.direction)}</TableCell>
                    <TableCell>L{exercise.complexityLevel}</TableCell>
                    <TableCell>
                      <Badge variant={exercise.isPublished ? 'default' : 'secondary'}>
                        {exercise.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/mnd/exercises/${exercise.id}/builder`}
                          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Конструктор
                        </Link>
                        <form
                          action={updateMndExercisePublishedAction.bind(
                            null,
                            exercise.id,
                            !exercise.isPublished,
                          )}
                        >
                          <button className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                            {exercise.isPublished ? 'Снять' : 'Опубликовать'}
                          </button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: number; hint: string }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
