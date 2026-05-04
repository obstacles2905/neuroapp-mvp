'use server';

import { apiDelete, apiPatch, apiPost } from '@/lib/api/server-client';
import { type ContentLocale, parseContentLocale } from '@/lib/locale';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CategoryCatalogAudience, LocalizedText } from '@/lib/types/api';

function readLocalized(formData: FormData, prefix: string): LocalizedText {
  return {
    ru: String(formData.get(`${prefix}_ru`) ?? ''),
    uk: String(formData.get(`${prefix}_uk`) ?? ''),
    en: String(formData.get(`${prefix}_en`) ?? ''),
  };
}

function parseCategoryCatalogAudience(raw: string): CategoryCatalogAudience {
  if (raw === 'experimental') {
    return 'experimental';
  }
  return 'production';
}

function localizedFromSingleLocale(
  locale: ContentLocale,
  title: string,
  description: string,
): { title: LocalizedText; description: LocalizedText } {
  const empty: LocalizedText = { ru: '', uk: '', en: '' };
  return {
    title: { ...empty, [locale]: title },
    description: { ...empty, [locale]: description },
  };
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const activeLocale = parseContentLocale(String(formData.get('active_locale') ?? ''));
  const titleText = String(formData.get('title') ?? '');
  const descriptionText = String(formData.get('description') ?? '');
  const { title, description } = localizedFromSingleLocale(
    activeLocale,
    titleText,
    descriptionText,
  );
  const orderRaw = String(formData.get('order') ?? '0');
  const order = Number.parseInt(orderRaw, 10);
  const isPublished = formData.get('isPublished') === 'on';
  const catalogAudience = parseCategoryCatalogAudience(
    String(formData.get('catalogAudience') ?? 'production'),
  );
  const flagRaw = String(formData.get('catalogFeatureFlagKey') ?? '').trim();
  const catalogFeatureFlagKey = flagRaw.length > 0 ? flagRaw : null;
  await apiPost('/categories', {
    title,
    description,
    order: Number.isFinite(order) ? order : 0,
    isPublished,
    catalogAudience,
    catalogFeatureFlagKey,
  });
  revalidatePath('/content');
  redirect('/content');
}

/** Тестовая категория → прод-каталог для всех; снимаем ключ флага и публикуем. */
export async function promoteCategoryToProductionAction(
  categoryId: string,
): Promise<void> {
  await apiPatch(`/categories/${categoryId}`, {
    catalogAudience: 'production',
    catalogFeatureFlagKey: null,
    isPublished: true,
  });
  revalidatePath('/content');
}

/** Прод-каталог → тестовый режим; снимаем с публикации (ключ флага не трогаем). */
export async function demoteCategoryFromProductionAction(
  categoryId: string,
): Promise<void> {
  await apiPatch(`/categories/${categoryId}`, {
    catalogAudience: 'experimental',
    isPublished: false,
  });
  revalidatePath('/content');
}

export async function deleteCategoryAction(categoryId: string): Promise<void> {
  await apiDelete(`/categories/${categoryId}`);
  revalidatePath('/content');
  revalidatePath('/content/lessons');
}

/** Удаляет урок (и контент). Допустимо только для неопубликованного урока — проверка на API. */
export async function deleteLessonAction(lessonId: string): Promise<void> {
  await apiDelete(`/lessons/${lessonId}`);
  revalidatePath('/content/lessons');
  revalidatePath('/content');
}

export async function updateCategoryTitleAction(
  categoryId: string,
  title: LocalizedText,
): Promise<void> {
  await apiPatch(`/categories/${categoryId}`, { title });
  revalidatePath('/content');
}

export async function updateCategoryTagsAction(
  categoryId: string,
  tags: string[],
): Promise<void> {
  await apiPatch(`/categories/${categoryId}`, { tags });
  revalidatePath('/content');
}

export async function createLessonAction(formData: FormData): Promise<void> {
  const categoryId = String(formData.get('categoryId') ?? '');
  const title = readLocalized(formData, 'title');
  const orderRaw = String(formData.get('order') ?? '0');
  const order = Number.parseInt(orderRaw, 10);
  await apiPost('/lessons', {
    categoryId,
    title,
    status: 'draft',
    order: Number.isFinite(order) ? order : 0,
  });
  revalidatePath('/content');
  revalidatePath('/content/lessons');
  redirect(`/content/lessons?categoryId=${encodeURIComponent(categoryId)}`);
}
