import { apiRequest } from '@/lib/api';
import type { AppCategoryListItem } from '@/lib/api/types/onboarding.types';

const BASE = '/api/app/categories';

export function fetchAppCategories(): Promise<AppCategoryListItem[]> {
  return apiRequest<AppCategoryListItem[]>(BASE, { method: 'GET' });
}
