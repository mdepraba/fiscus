import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { MigrationError, runMigrations } from './migrations.js';
import { createTestDatabase, describeWithDatabase, type TestDatabase } from './testing.js';

describe('runMigrations', () => {
  it('rejects a module name that is not lower case', async () => {
    await expect(
      runMigrations({
        connectionString: 'postgres://fiscus@127.0.0.1:1/unused',
        sources: [{ module: 'Core', directory: '.' }],
      }),
    ).rejects.toThrow(MigrationError);
  });

  it('rejects a module listed twice', async () => {
    await expect(
      runMigrations({
        connectionString: 'postgres://fiscus@127.0.0.1:1/unused',
        sources: [
          { module: 'core', directory: '.' },
          { module: 'core', directory: '.' },
        ],
      }),
    ).rejects.toThrow(/listed twice/);
  });
});

describeWithDatabase('runMigrations against PostgreSQL', () => {
  let database: TestDatabase;
  let root: string;

  beforeEach(async () => {
    database = await createTestDatabase();
    root = await mkdtemp(join(tmpdir(), 'fiscus-migrations-'));
  });
  afterEach(async () => {
    await database.drop();
    await rm(root, { recursive: true, force: true });
  });

  async function write(module: string, name: string, sql: string) {
    await mkdir(join(root, module), { recursive: true });
    await writeFile(join(root, module, name), sql);
  }

  const migrate = (...modules: string[]) =>
    runMigrations({
      connectionString: database.url,
      sources: modules.map((module) => ({ module, directory: join(root, module) })),
    });

  async function query<T extends pg.QueryResultRow>(text: string) {
    const client = new pg.Client({ connectionString: database.url });
    await client.connect();
    try {
      return (await client.query<T>(text)).rows;
    } finally {
      await client.end();
    }
  }

  it('applies the folders in the order given, each in file-name order', async () => {
    await write('fiscus', '0001_schema.sql', 'CREATE SCHEMA fiscus;');
    await write('core', '0002_audit.sql', 'CREATE TABLE core.audit (id int);');
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');

    expect(await migrate('core', 'fiscus')).toEqual([
      { module: 'core', name: '0001_schema.sql' },
      { module: 'core', name: '0002_audit.sql' },
      { module: 'fiscus', name: '0001_schema.sql' },
    ]);

    expect(
      await query('SELECT module, name FROM public.schema_migrations ORDER BY applied_at, module'),
    ).toEqual([
      { module: 'core', name: '0001_schema.sql' },
      { module: 'core', name: '0002_audit.sql' },
      { module: 'fiscus', name: '0001_schema.sql' },
    ]);
  });

  it('does nothing the second time', async () => {
    // Running this file twice would fail, so a clean second run proves it was skipped.
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await migrate('core');
    expect(await migrate('core')).toEqual([]);
  });

  it('applies only the files added since the last run', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await migrate('core');
    await write('core', '0002_audit.sql', 'CREATE TABLE core.audit (id int);');
    expect(await migrate('core')).toEqual([{ module: 'core', name: '0002_audit.sql' }]);
  });

  it('runs a drizzle-kit file with statement breakpoints', async () => {
    await write(
      'core',
      '0000_init.sql',
      'CREATE SCHEMA "core";\n--> statement-breakpoint\nCREATE TABLE "core"."t" ("id" uuid PRIMARY KEY DEFAULT uuidv7());\n',
    );
    await migrate('core');
    expect(await query('SELECT * FROM core.t')).toEqual([]);
  });

  it('refuses a file that changed after it was applied', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await migrate('core');
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core_renamed;');
    await expect(migrate('core')).rejects.toThrow(
      'core/0001_schema.sql changed after it was applied',
    );
  });

  it('ignores a change of line endings', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;\n-- done\n');
    await migrate('core');
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;\r\n-- done\r\n');
    expect(await migrate('core')).toEqual([]);
  });

  it('rolls back a failing file and does not record it', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await write('core', '0002_broken.sql', 'CREATE TABLE core.half (id int); SELECT 1 / 0;');

    await expect(migrate('core')).rejects.toThrow('core/0002_broken.sql failed: division by zero');
    expect(await query("SELECT to_regclass('core.half') IS NULL AS gone")).toEqual([
      { gone: true },
    ]);
    expect(await query('SELECT name FROM public.schema_migrations')).toEqual([
      { name: '0001_schema.sql' },
    ]);
  });

  it('treats a missing folder as empty and skips files that are not SQL', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await write('core', 'README.md', 'not a migration');
    await mkdir(join(root, 'core', 'meta'));
    await write('core/meta', '_journal.json', '{}');

    expect(await migrate('core', 'fiscus')).toEqual([{ module: 'core', name: '0001_schema.sql' }]);
  });

  it('lets concurrent runs take turns', async () => {
    await write('core', '0001_schema.sql', 'CREATE SCHEMA core;');
    await write('core', '0002_slow.sql', 'SELECT pg_sleep(0.2);');

    const [first, second] = await Promise.all([migrate('core'), migrate('core')]);
    expect([...first, ...second]).toHaveLength(2);
  });
});
