import { createDatabase, type Database } from '@core/db';
import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { AppConfig } from './config.js';

/**
 * The DI token for the Drizzle client. `Database` is a type, not a class, so
 * it needs a token: inject it with `@Inject(DATABASE)`.
 */
export const DATABASE = Symbol('DATABASE');

/**
 * The process's one pool of 5 connections (PRD 5.1), shared by every module.
 * The pool connects lazily, so the API starts even while PostgreSQL is down,
 * and /health reports it.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [AppConfig],
      useFactory: (config: AppConfig): Database => {
        const logger = new Logger('Database');
        return createDatabase({
          connectionString: config.databaseUrl,
          onIdleError: (error) => logger.warn(`An idle connection failed: ${error.message}`),
        }).db;
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.$client.end();
  }
}
