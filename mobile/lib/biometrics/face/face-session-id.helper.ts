export function createFaceSessionId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `face-${stamp}-${rand}`;
}

export function buildFaceHeadlineSession(
  expressivenessScore: number,
  capturedAtIso: string,
): string {
  const datePart = capturedAtIso.slice(0, 10);
  return `Мимика · ${Math.round(expressivenessScore)} · ${datePart}`;
}
