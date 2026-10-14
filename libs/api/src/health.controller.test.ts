import 'reflect-metadata';
import { createTestDatabase, describeWithDatabase, type TestDatabase } from '@core/db/testing';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { CoreModule } from './core.module.js';

/** Boots core over HTTP without a socket, through Fastify's `inject`. */
async function boot(databaseUrl: string): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    CoreModule.forRoot({ host: '127.0.0.1', port: 0, databaseUrl }),
    new FastifyAdapter(),
    { logger: false },
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

describe('GET /health', () => {
  it('answers 503 while PostgreSQL is unreachable', async () => {
    // Nothing listens on port 1, so the connection is refused at once.
    const app = await boot('postgres://fiscus:fiscus@127.0.0.1:1/fiscus');
    try {
      const response = await app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ status: 'unavailable' });
    } finally {
      await app.close();
    }
  });
});

describeWithDatabase('GET /health against PostgreSQL', () => {
  let database: TestDatabase;
  let app: NestFastifyApplication;

  beforeAll(async () => {
    database = await createTestDatabase();
    app = await boot(database.url);
  });
  afterAll(async () => {
    // Closing the app ends the pool, so the database can be dropped.
    await app.close();
    await database.drop();
  });

  it('answers 200 once the database answers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
