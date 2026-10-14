import { drizzle } from 'drizzle-orm/node-postgres';
// pg is CommonJS; its default export carries Pool and Client.
import pg from 'pg';

/**
 * PRD 5.1: one pool of 5 connections for the whole process. pg-boss will
 * share it (tech-stack.md), so the host's 20 connections (PRD 5.3) are not
 * overrun.
 */
export const POOL_SIZE = 5;

/** PostgreSQL limits applied to every connection in the pool. */
export const STATEMENT_TIMEOUT_MS = 15_000;
export const IDLE_IN_TRANSACTION_TIMEOUT_MS = 30_000;

export interface DatabaseOptions {
  connectionString: string;
  /**
   * Called when an idle connection fails, for example when PostgreSQL
   * restarts. The pool drops the connection and the next query opens a new
   * one; without a listener, the error would end the process.
   */
  onIdleError?: (error: Error) => void;
}

export function createDatabase({ connectionString, onIdleError = () => {} }: DatabaseOptions) {
  const pool = new pg.Pool({
    connectionString,
    max: POOL_SIZE,
    // An idle backend still holds memory on the 1 GB host (PRD 5.3).
    idleTimeoutMillis: 30_000,
    // Fail fast when PostgreSQL is down, so callers can answer 503 (EC-16).
    connectionTimeoutMillis: 5_000,
    // Set per connection, so they cover every query on it, pg-boss's too.
    statement_timeout: STATEMENT_TIMEOUT_MS,
    idle_in_transaction_session_timeout: IDLE_IN_TRANSACTION_TIMEOUT_MS,
    application_name: 'fiscus',
  });
  pool.on('error', onIdleError);

  // Columns are snake_case in PostgreSQL (docs/database, "Conventions").
  const db = drizzle({ client: pool, casing: 'snake_case' });

  return { pool, db, close: () => pool.end() };
}

export type Database = ReturnType<typeof createDatabase>['db'];

/**
 * A handle that reads and writes, inside a transaction or not. Drizzle types
 * a transaction apart from the database, so a repository method that must
 * join its caller's transaction (an audit row commits with its change, FR-13)
 * takes this instead of `Database`.
 */
export type DatabaseExecutor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];
