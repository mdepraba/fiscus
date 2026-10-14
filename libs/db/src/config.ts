/** Environment variables, as `process.env` holds them. */
export type Environment = Readonly<Record<string, string | undefined>>;

/**
 * A missing or malformed setting. The message names the key and never its
 * value, because a value may be a credential and errors reach the logs
 * (NFR-10, NFR-11).
 */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/**
 * The PostgreSQL connection string. In production systemd fills it from
 * /srv/fiscus/.env (NFR-10). Read here so the API and the migration runner
 * check it the same way.
 */
export function readDatabaseUrl(env: Environment): string {
  const value = env.DATABASE_URL?.trim();
  if (!value) {
    throw new ConfigError('DATABASE_URL is required.');
  }

  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    throw new ConfigError('DATABASE_URL is not a valid URL.');
  }
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new ConfigError('DATABASE_URL must be a postgres:// or postgresql:// URL.');
  }
  return value;
}
