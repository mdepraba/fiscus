import { ConfigError, type Environment, readDatabaseUrl } from '@core/db';

/**
 * Fiscus's settings, read once at startup from the environment. In
 * production systemd fills it from /srv/fiscus/.env (NFR-10); in development
 * Bun loads the repo's .env. Only this file and `readDatabaseUrl` read
 * `process.env` (tech-stack.md).
 *
 * An abstract class rather than an interface, so it can be the DI token.
 */
export abstract class AppConfig {
  /** FR-01: loopback, because only `tailscale serve` reaches the app. */
  abstract readonly host: string;
  abstract readonly port: number;
  abstract readonly databaseUrl: string;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;

/** Every problem at once, so a broken .env is fixed in one pass. */
export function loadConfig(env: Environment): AppConfig {
  const problems: string[] = [];

  const host = env.HOST?.trim() || DEFAULT_HOST;

  let port = DEFAULT_PORT;
  const rawPort = env.PORT?.trim();
  if (rawPort) {
    port = Number(rawPort);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      problems.push('PORT must be a whole number from 1 to 65535.');
    }
  }

  let databaseUrl = '';
  try {
    databaseUrl = readDatabaseUrl(env);
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    problems.push(error.message);
  }

  if (problems.length > 0) {
    throw new ConfigError(
      `Invalid configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`,
    );
  }
  return { host, port, databaseUrl };
}
