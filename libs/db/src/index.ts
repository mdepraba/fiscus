// The database client and the migration runner (PRD 5.1, PRD 5.4). Each
// module owns its schema and its migrations; this applies them.
export {
  createDatabase,
  type Database,
  type DatabaseExecutor,
  type DatabaseOptions,
  IDLE_IN_TRANSACTION_TIMEOUT_MS,
  POOL_SIZE,
  STATEMENT_TIMEOUT_MS,
} from './client.js';
export { ConfigError, type Environment, readDatabaseUrl } from './config.js';
export {
  type AppliedMigration,
  MigrationError,
  type MigrationSource,
  type RunMigrationsOptions,
  runMigrations,
} from './migrations.js';
