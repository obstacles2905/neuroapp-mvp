import { apiRequest } from '@/lib/api';
import type {
  AppLessonDetail,
  AppLessonListItem,
  AppLessonProgressSnapshot,
  UpdateLessonProgressBody,
} from '@/lib/api/types/lessons.types';

const BASE = '/api/app';

export function fetchCategoryLessons(
  categoryId: string,
): Promise<AppLessonListItem[]> {
  return apiRequest<AppLessonListItem[]>(`${BASE}/categories/${categoryId}/lessons`, {
    method: 'GET',
  });
}

export function fetchLesson(lessonId: string): Promise<AppLessonDetail> {
  return apiRequest<AppLessonDetail>(`${BASE}/lessons/${lessonId}`, {
    method: 'GET',
  });
}

export function updateLessonProgress(
  lessonId: string,
  body: UpdateLessonProgressBody,
): Promise<AppLessonProgressSnapshot> {
  return apiRequest<AppLessonProgressSnapshot>(`${BASE}/lessons/${lessonId}/progress`, {
    method: 'PATCH',
    json: body,
  });
}
