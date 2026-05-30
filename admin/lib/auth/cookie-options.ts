import { isProductionDeployment } from '@/lib/api/config';

type SessionCookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
  secure?: boolean;
};

export function buildAdminSessionCookieOptions(
  maxAgeSeconds: number,
): SessionCookieOptions {
  const options: SessionCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
  if (isProductionDeployment()) {
    options.secure = true;
  }
  return options;
}
