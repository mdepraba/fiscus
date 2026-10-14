import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

/**
 * Applies each module's SQL migrations and records them in
 * `public.schema_migrations` (docs/database, "Migrations"). The deploy runs it
 * before restarting the API (FR-07).
 *
 * The record lives in `public` rather than in `core`, so that core's first
 * migration can create its own schema.
 */

export interface MigrationSource {
  /** The owning module, which is also the key its files are recorded under. */
  module: string;
  /** The module's `migrations/` folder. A missing folder counts as empty. */
  directory: string;
}

export interface AppliedMigration {
  module: string;
  name: string;
}

export interface RunMigrationsOptions {
  connectionString: string;
  /** Applied in this order; inside a folder, files run in name order. */
  sources: readonly MigrationSource[];
  /** One line per applied file. Names only, never SQL or data (NFR-11). */
  log?: (message: string) => void;
}

/** A migration that cannot run, or a recorded one that has changed since. */
export class MigrationError extends Error {
  override readonly name = 'MigrationError';
}

/** Any fixed key: it only has to be the same for every runner. */
const LOCK_KEY = 3_472_664;
const MODULE_NAME = /^[a-z][a-z0-9_]*$/;

interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

/**
 * Applies every file not yet recorded and returns them, so a second run with
 * nothing new returns `[]`. Each file and its record commit in one
 * transaction, so a failing file leaves neither behind. An advisory lock
 * makes concurrent runs take turns.
 *
 * drizzle-kit's `--> statement-breakpoint` lines are SQL comments, so a
 * generated file runs as one multi-statement query.
 */
export async function runMigrations({
  connectionString,
  sources,
  log = () => {},
}: RunMigrationsOptions): Promise<AppliedMigration[]> {
  checkSources(sources);

  const client = new pg.Client({
    connectionString,
    application_name: 'fiscus-migrate',
    // The API's 15-second cap would abort an index build on a large table.
    statement_timeout: 0,
    idle_in_transaction_session_timeout: 0,
  });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        module text NOT NULL,
        name text NOT NULL,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (module, name)
      )`);
    const { rows } = await client.query<AppliedMigration & { checksum: string }>(
      'SELECT module, name, checksum FROM public.schema_migrations',
    );
    const recorded = new Map(rows.map((row) => [`${row.module}/${row.name}`, row.checksum]));

    const applied: AppliedMigration[] = [];
    for (const { module, directory } of sources) {
      for (const migration of await readMigrations(directory)) {
        const key = `${module}/${migration.name}`;
        const checksum = recorded.get(key);
        if (checksum !== undefined) {
          if (checksum !== migration.checksum) {
            throw new MigrationError(
              `${key} changed after it was applied. Write a new migration instead.`,
            );
          }
          continue;
        }

        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO public.schema_migrations (module, name, checksum) VALUES ($1, $2, $3)',
            [module, migration.name, migration.checksum],
          );
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          const reason = error instanceof Error ? error.message : String(error);
          throw new MigrationError(`${key} failed: ${reason}`, { cause: error });
        }
        log(`Applied ${key}`);
        applied.push({ module, name: migration.name });
      }
    }
    return applied;
  } finally {
    // Ending the session also releases the advisory lock.
    await client.end();
  }
}

function checkSources(sources: readonly MigrationSource[]): void {
  const seen = new Set<string>();
  for (const { module } of sources) {
    if (!MODULE_NAME.test(module)) {
      throw new MigrationError(`"${module}" is not a module name: use lower case, digits and _.`);
    }
    if (seen.has(module)) {
      throw new MigrationError(`The module "${module}" is listed twice.`);
    }
    seen.add(module);
  }
}

async function readMigrations(directory: string): Promise<Migration[]> {
  let names: string[];
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(join(directory, name), 'utf8');
      // Line endings do not change what runs, so they do not change the sum.
      const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
      return { name, sql, checksum };
    }),
  );
}
