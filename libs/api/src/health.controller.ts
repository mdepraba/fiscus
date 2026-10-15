import type { Database } from '@core/db';
import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE } from './database.module.js';

/**
 * Polled by the deploy to decide whether a release came up (NFR-06). A
 * release that cannot reach PostgreSQL has not, so it answers 503 until it
 * can.
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return { status: 'ok' };
  }
}
