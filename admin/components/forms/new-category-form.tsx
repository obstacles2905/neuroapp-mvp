'use client';

import { createCategoryAction } from '@/app/actions/content';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONTENT_LOCALES, type ContentLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

export function NewCategoryForm() {
  const [locale, setLocale] = useState<ContentLocale>('ru');

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Новая категория</CardTitle>
        <CardDescription>
          Выберите язык, на котором сейчас заполняете поля. Остальные локали останутся пустыми — их
          можно дополнить позже через API или будущий редактор.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createCategoryAction} className="space-y-6">
          <input type="hidden" name="active_locale" value={locale} />

          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Язык контента</span>
            <div
              className="flex flex-wrap gap-1 rounded-xl bg-muted/80 p-1 ring-1 ring-border/60"
              role="tablist"
              aria-label="Язык редактирования"
            >
              {CONTENT_LOCALES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={locale === item.id}
                  onClick={() => setLocale(item.id)}
                  className={cn(
                    'min-w-[5.5rem] flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all',
                    locale === item.id
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/80'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Название ({locale.toUpperCase()})
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="input-admin"
              placeholder="Например, Дыхательные практики"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Описание ({locale.toUpperCase()})
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input-admin min-h-[100px] resize-y"
              placeholder="Кратко опишите категорию для этого языка"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="catalogAudience" className="text-sm font-medium text-foreground">
              Каталог в приложении
            </label>
            <select
              id="catalogAudience"
              name="catalogAudience"
              className="input-admin"
              defaultValue="production"
            >
              <option value="production">Прод — видна всем в основном каталоге</option>
              <option value="experimental">
                Тест / закрытый запуск — не в дефолтной выдаче
              </option>
            </select>
            <p className="text-xs text-muted-foreground">
              Для experimental приложение может показывать категорию только при включённом
              фичефлаге (ключ ниже).
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="catalogFeatureFlagKey" className="text-sm font-medium text-foreground">
              Ключ фичефлага (необязательно)
            </label>
            <input
              id="catalogFeatureFlagKey"
              name="catalogFeatureFlagKey"
              type="text"
              className="input-admin"
              placeholder="Например beta_sleep_category"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="order" className="text-sm font-medium text-foreground">
                Порядок сортировки
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
            <Button type="submit">Создать категорию</Button>
            <Link href="/content" className={cn(buttonVariants({ variant: 'outline' }))}>
              Отмена
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
