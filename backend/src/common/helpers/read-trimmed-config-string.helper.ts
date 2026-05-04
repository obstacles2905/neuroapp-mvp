import type { ConfigService } from '@nestjs/config';

export function readTrimmedConfigString(
  configService: ConfigService,
  key: string,
  defaultValue: string,
): string {
  const raw = configService.get<string | undefined>(key);
  if (raw === undefined || raw === null) {
    return defaultValue;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : defaultValue;
}
