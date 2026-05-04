'use client';

import { createMndExerciseAction } from '@/app/actions/mnd';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTENT_LOCALES } from '@/lib/locale';
import type { MndMasterStack } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type NewMndExerciseFormProps = {
  stacks: MndMasterStack[];
};

function stackLabel(stack: MndMasterStack): string {
  return `${stack.code} · ${stack.title.ru || stack.title.uk || stack.title.en}`;
}

export function NewMndExerciseForm({ stacks }: NewMndExerciseFormProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Новое MND-упражнение</CardTitle>
        <CardDescription>
          Сначала задайте метаданные упражнения. После создания сразу откроется конструктор слайдов,
          где можно выбрать тип слайда: текст, видео, анимация, практика или биометрия.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createMndExerciseAction} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="masterStackId" className="text-sm font-medium text-foreground">
                Мастер-стек
              </label>
              <select id="masterStackId" name="masterStackId" required className="input-admin">
                <option value="">— выберите стек —</option>
                {stacks.map((stack) => (
                  <option key={stack.id} value={stack.id}>
                    {stackLabel(stack)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="direction" className="text-sm font-medium text-foreground">
                Направление
              </label>
              <select id="direction" name="direction" required className="input-admin">
                <option value="bottom_up">Bottom-Up · тело → мозг</option>
                <option value="top_down">Top-Down · мозг → тело</option>
              </select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium text-foreground">Название</legend>
            {CONTENT_LOCALES.map((locale) => (
              <div key={locale.id} className="space-y-1">
                <label htmlFor={`title_${locale.id}`} className="text-xs font-medium text-muted-foreground">
                  {locale.label}
                </label>
                <input
                  id={`title_${locale.id}`}
                  name={`title_${locale.id}`}
                  type="text"
                  required={locale.id === 'ru'}
                  className="input-admin"
                  placeholder={locale.id === 'ru' ? 'Например, Ушной тумблер' : ''}
                />
              </div>
            ))}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="complexityLevel" className="text-sm font-medium text-foreground">
                Уровень L1-L15
              </label>
              <input
                id="complexityLevel"
                name="complexityLevel"
                type="number"
                min={1}
                max={15}
                defaultValue={1}
                required
                className="input-admin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="order" className="text-sm font-medium text-foreground">
                Порядок
              </label>
              <input
                id="order"
                name="order"
                type="number"
                min={0}
                defaultValue={0}
                className="input-admin"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="isPublished"
                  className="size-4 rounded border-input accent-primary"
                />
                Опубликовать сразу
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit">Создать и открыть конструктор</Button>
            <Link href="/mnd" className={cn(buttonVariants({ variant: 'outline' }))}>
              Отмена
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
