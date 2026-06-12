import { signAppMediaStreamPayload } from './sign-app-media-stream.helper';

export function buildAppMediaStreamUrl(
  apiBaseUrl: string,
  objectKey: string,
  exp: number,
  secret: string,
): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const sig = signAppMediaStreamPayload(objectKey, exp, secret);
  const params = new URLSearchParams({
    key: objectKey,
    exp: String(exp),
    sig,
  });
  return `${base}/api/app/media/stream?${params.toString()}`;
}
