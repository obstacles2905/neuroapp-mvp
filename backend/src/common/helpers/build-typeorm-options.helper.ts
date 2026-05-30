import type { ConfigService } from '@nestjs/config';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { readTrimmedConfigString } from './read-trimmed-config-string.helper';

type ParsedDatabaseUrl = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

function normalizeDatabaseUrl(raw: string): string {
  return raw.replace(/^postgres:\/\//i, 'postgresql://');
}

function parseDatabaseUrl(raw: string): ParsedDatabaseUrl {
  const parsed = new URL(normalizeDatabaseUrl(raw));
  const database = parsed.pathname.replace(/^\//, '');
  if (database.length === 0) {
    throw new Error('DATABASE_URL must include a database name');
  }
  return {
    host: parsed.hostname,
    port: Number.parseInt(parsed.port.length > 0 ? parsed.port : '5432', 10),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

function resolveDatabaseConnection(
  configService: ConfigService,
): Pick<
  PostgresConnectionOptions,
  'host' | 'port' | 'username' | 'password' | 'database'
> {
  const databaseUrl = readTrimmedConfigString(
    configService,
    'DATABASE_URL',
    '',
  );
  if (databaseUrl.length > 0) {
    return parseDatabaseUrl(databaseUrl);
  }
  return {
    host: readTrimmedConfigString(configService, 'DATABASE_HOST', '127.0.0.1'),
    port: Number.parseInt(
      readTrimmedConfigString(configService, 'DATABASE_PORT', '5432'),
      10,
    ),
    username: readTrimmedConfigString(
      configService,
      'DATABASE_USER',
      'neurosync',
    ),
    password: readTrimmedConfigString(
      configService,
      'DATABASE_PASSWORD',
      'neurosync_dev',
    ),
    database: readTrimmedConfigString(
      configService,
      'DATABASE_NAME',
      'neurosync',
    ),
  };
}

function resolveSsl(
  configService: ConfigService,
): PostgresConnectionOptions['ssl'] {
  const sslFlag = readTrimmedConfigString(configService, 'DATABASE_SSL', '');
  if (sslFlag === 'true') {
    return { rejectUnauthorized: false };
  }
  const databaseUrl = readTrimmedConfigString(
    configService,
    'DATABASE_URL',
    '',
  );
  if (
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('ssl=true')
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}

export function buildTypeOrmOptions(
  configService: ConfigService,
  entities: PostgresConnectionOptions['entities'],
): PostgresConnectionOptions {
  return {
    type: 'postgres',
    ...resolveDatabaseConnection(configService),
    entities,
    synchronize:
      readTrimmedConfigString(configService, 'DATABASE_SYNC', 'false') ===
      'true',
    logging:
      readTrimmedConfigString(configService, 'DATABASE_LOGGING', 'false') ===
      'true',
    ssl: resolveSsl(configService),
  };
}
