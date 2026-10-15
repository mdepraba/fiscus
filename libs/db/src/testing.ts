/// <reference types="vitest/globals" />
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { readDatabaseUrl } from './config.js';

/**
 * Helpers for tests that run against a real PostgreSQL 18 (architecture
 * guide, "Testing by layer"). Imported only by test files, as
 * `@core/db/testing`, so none of it reaches a bundle.
 *
 * The server comes from DATABASE_URL: compose.yaml in development, the
 * PostgreSQL service in CI. Without it the database tests are skipped, except
 * in CI, where a missing URL fails the run instead of passing it silently.
 */
const serverUrl = process.env.DATABASE_URL?.trim() || undefined;

if (!serverUrl && process.env.CI) {
  throw new Error('DATABASE_URL must be set in CI, or every database test would be skipped.');
}

/**
 * `describe` that runs only when a database server is configured. It uses
 * the global `describe` (every Vitest config sets `globals`) rather than an
 * import: on Windows a drive-letter case mismatch can load a second copy of
 * Vitest, whose `describe` has no runner behind it.
 */
export function describeWithDatabase(name: string, body: () => void): void {
  describe.skipIf(!serverUrl)(name, body);
}

export interface TestDatabase {
  /** Connection string for the new, empty database. */
  readonly url: string;
  drop(): Promise<void>;
}

/**
 * A new, empty database on the DATABASE_URL server, so tests never share
 * state, even when Nx runs projects in parallel. The role needs CREATEDB.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const server = readDatabaseUrl(process.env);
  // Generated from hex only, so it is safe to put in the statement.
  const name = `fiscus_test_${randomUUID().replaceAll('-', '')}`;
  await onServer(server, `CREATE DATABASE "${name}"`);

  const url = new URL(server);
  url.pathname = `/${name}`;
  return {
    url: url.toString(),
    drop: () => onServer(server, `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`),
  };
}

async function onServer(server: string, statement: string): Promise<void> {
  const client = new pg.Client({ connectionString: server });
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
}
