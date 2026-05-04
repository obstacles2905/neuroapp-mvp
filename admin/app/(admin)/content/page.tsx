import { CategoryCardMenu } from '@/components/content/category-card-menu';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import type { Category } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const EMPTY_CATEGORY_TAGS: string[] = [];

export default async function ContentPage() {
  const categories = await apiGet<Category[]>('/categories');

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Content Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Категории и уроки. Редактор шагов урока — следующий этап.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/content/new" className={cn(buttonVariants())}>
            Новая категория
          </Link>
          <Link href="/content/lessons/new" className={cn(buttonVariants({ variant: 'outline' }))}>
            Новый урок
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Категорий пока нет — создайте первую кнопкой выше.
          </p>
        ) : (
          categories.map((cat) => {
            const categoryTitle =
              cat.title.ru || cat.title.uk || cat.title.en || 'Без названия';
            const categoryTags = cat.tags ?? EMPTY_CATEGORY_TAGS;
            return (
              <Card
                key={cat.id}
                className="overflow-visible border-border/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{categoryTitle}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {cat.description.ru || cat.description.uk || cat.description.en || '—'}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={cat.isPublished ? 'default' : 'secondary'}>
                        {cat.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge
                        variant={
                          cat.catalogAudience === 'experimental' ? 'outline' : 'secondary'
                        }
                        className="text-xs font-normal"
                      >
                        {cat.catalogAudience === 'experimental' ? 'Тест / флаг' : 'Прод'}
                      </Badge>
                    </div>
                    <CategoryCardMenu
                      categoryId={cat.id}
                      categoryLabel={categoryTitle}
                      catalogAudience={cat.catalogAudience}
                      title={cat.title}
                      tags={categoryTags}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {categoryTags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {cat.catalogFeatureFlagKey ? (
                    <p className="text-xs text-muted-foreground">
                      Флаг: <span className="font-mono">{cat.catalogFeatureFlagKey}</span>
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/content/lessons?categoryId=${cat.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Уроки →
                    </Link>
                    <Link
                      href={`/content/lessons/new?categoryId=${encodeURIComponent(cat.id)}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Добавить урок
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
