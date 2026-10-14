import { Controller, Get } from '@nestjs/common';

/** What the deploy polls after a restart (NFR-06). */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
