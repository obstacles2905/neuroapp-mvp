import { createHmac, timingSafeEqual } from 'crypto';

export function signAppMediaStreamPayload(
  objectKey: string,
  exp: number,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${objectKey}:${exp}`)
    .digest('hex');
}

export function verifyAppMediaStreamSignature(
  objectKey: string,
  exp: number,
  signature: string,
  secret: string,
): boolean {
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = signAppMediaStreamPayload(objectKey, exp, secret);
  if (signature.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}
