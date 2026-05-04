import { apiRequest } from '@/lib/api';
import type {
  AppRegisterRequest,
  AppUserMe,
  AuthTokensResponse,
} from '@/lib/api/types/app-auth.types';

const APP_AUTH_BASE = '/api/app/auth';

export async function appAuthLogin(
  email: string,
  password: string,
): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>(`${APP_AUTH_BASE}/login`, {
    method: 'POST',
    json: { email, password },
  });
}

export async function appAuthRegister(
  body: AppRegisterRequest,
): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>(`${APP_AUTH_BASE}/register`, {
    method: 'POST',
    json: body,
  });
}

export async function fetchAppMe(): Promise<AppUserMe> {
  return apiRequest<AppUserMe>(`${APP_AUTH_BASE}/me`, { method: 'GET' });
}
