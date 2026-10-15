import { sql } from 'drizzle-orm';
import { createDatabase, POOL_SIZE } from './client.js';
import { createTestDatabase, describeWithDatabase, type TestDatabase } from './testing.js';

describe('createDatabase', () => {
  it('opens one pool of 5 connections (PRD 5.1)', async () => {
    const { pool, close } = createDatabase({
      connectionString: 'postgres://fiscus@127.0.0.1:1/unused',
    });
    expect(POOL_SIZE).toBe(5);
    expect(pool.options.max).toBe(5);
    expect(pool.options.statement_timeout).toBe(15_000);
    expect(pool.options.application_name).toBe('fiscus');
    await close();
  });
});

describeWithDatabase('createDatabase against PostgreSQL', () => {
  let database: TestDatabase;

  beforeAll(async () => {
    database = await createTestDatabase();
  });
  afterAll(() => database.drop());

  it('queries through Drizzle on PostgreSQL 18', async () => {
    const { db, close } = createDatabase({ connectionString: database.url });
    try {
      const result = await db.execute<{ major: number }>(
        sql`SELECT current_setting('server_version_num')::int / 10000 AS major`,
      );
      expect(Number(result.rows[0]?.major)).toBe(18);
    } finally {
      await close();
    }
  });

  it('applies the statement timeout to each connection', async () => {
    const { pool, close } = createDatabase({ connectionString: database.url });
    try {
      const { rows } = await pool.query<{ statement_timeout: string }>('SHOW statement_timeout');
      expect(rows[0]?.statement_timeout).toBe('15s');
    } finally {
      await close();
    }
  });
});
